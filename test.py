import os
import numpy as np
import torch
from torch.utils.data import DataLoader
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2
from transformers import SegformerForSemanticSegmentation
from tqdm import tqdm

import config
from dataset import OffRoadDataset
from utils import compute_iou, visualize_mask, log_iou_scores
from embedder import create_embedder
from qdrant_utils import QdrantManager


def get_transform():
    return A.Compose([
        A.Resize(config.IMAGE_SIZE, config.IMAGE_SIZE),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2()
    ])


def load_model(model_path, device):
    model = SegformerForSemanticSegmentation.from_pretrained(
        config.MODEL_NAME,
        num_labels=config.NUM_CLASSES,
        ignore_mismatched_sizes=True
    )
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    return model


def run_inference(model, image_tensor, device):
    image_tensor = image_tensor.to(device)
    
    with torch.no_grad():
        outputs = model(image_tensor).logits
        
        upsampled = torch.nn.functional.interpolate(
            outputs,
            size=(config.IMAGE_SIZE, config.IMAGE_SIZE),
            mode='bilinear',
            align_corners=False
        )
        
        pred_mask = upsampled.argmax(dim=1)
    
    return pred_mask, upsampled


def process_test_images(model, test_loader, device, qdrant_manager=None, embedder_model=None,
                     save_dir="predictions", compute_iou_flag=True):
    os.makedirs(save_dir, exist_ok=True)
    
    model.eval()
    
    all_ious = []
    predictions_info = []
    
    pbar = tqdm(test_loader, desc="Testing")
    
    for batch_idx, (images, masks, img_names) in enumerate(pbar):
        images = images.to(device)
        
        pred_mask, logits = run_inference(model, images, device)
        
        for i in range(pred_mask.size(0)):
            idx = batch_idx * test_loader.batch_size + i
            if idx >= len(test_loader.dataset):
                break
            
            img_name = img_names[i] if i < len(img_names) else f"image_{idx}.png"
            
            pred = pred_mask[i].cpu().numpy()
            
            save_path = os.path.join(save_dir, os.path.splitext(img_name)[0] + '_pred.png')
            Image.fromarray(pred.astype(np.uint8)).save(save_path)
            
            iou_score = None
            if compute_iou_flag and masks is not None and i < masks.size(0):
                target = masks[i].cpu().numpy()
                mean_iou, iou_per_class = compute_iou(pred, target, config.NUM_CLASSES)
                iou_score = mean_iou
                all_ious.append(mean_iou)
            
            unique_classes = np.unique(pred)
            pred_classes = unique_classes.tolist()
            
            info = {
                'image_id': os.path.splitext(img_name)[0],
                'predicted_classes': pred_classes,
                'IoU_score': iou_score,
                'save_path': save_path
            }
            predictions_info.append(info)
            
            if qdrant_manager and embedder_model:
                img_tensor = images[i:i+1]
                
                with torch.no_grad():
                    encoder_output = embedder_model.encoder(img_tensor.to(config.DEVICE), 
                                                               output_hidden_states=True)
                    embedding = encoder_output.hidden_states[-1]
                    embedding = torch.nn.functional.adaptive_avg_pool2d(embedding, (1, 1))
                    embedding = embedding.view(embedding.size(0), -1)
                    embedding = torch.nn.functional.normalize(embedding, p=2, dim=1)
                    embedding = embedding.cpu().numpy()[0]
                
                payload = {
                    'image_id': info['image_id'],
                    'predicted_classes': pred_classes,
                    'IoU_score': float(iou_score) if iou_score is not None else None
                }
                
                qdrant_manager.insert_embedding(embedding, payload)
            
            pbar.set_postfix({'last_iou': f'{iou_score:.4f}' if iou_score else 'N/A'})
    
    if compute_iou_flag and all_ious:
        mean_iou = np.mean(all_ious)
        print(f"\n Test Results:")
        print(f"  Mean IoU: {mean_iou:.4f}")
        return mean_iou, predictions_info
    else:
        return None, predictions_info


def analyze_failures(qdrant_manager, top_k=5):
    print(f"\n Failure Case Analysis (IoU < 0.5):")
    
    results = qdrant_manager.search_by_filter(
        filter_conditions={'is_failure': True},
        top_k=top_k
    )
    
    if not any(r['payload'].get('IoU_score', 1.0) < 0.5 for r in results):
        print("  No stored failure cases found in Qdrant yet.")
        print("  Run test.py with --store-failures flag to enable failure analysis")
        return
    
    print(f" Top {len(results)} similar failure cases found:")
    for i, result in enumerate(results):
        payload = result['payload']
        print(f"  {i+1}. Image: {payload.get('image_id', 'unknown')}")
        print(f"      IoU Score: {payload.get('IoU_score', 'N/A'):.4f}")
        print(f"      Predicted Classes: {payload.get('predicted_classes', [])}")


def find_similar_scenes(qdrant_manager, query_embedding, top_k=5):
    print(f"\n Searching for similar scenes...")
    
    results = qdrant_manager.search_similar(
        query_vector=query_embedding,
        top_k=top_k
    )
    
    print(f" Top {len(results)} similar scenes found:")
    for i, result in enumerate(results):
        payload = result['payload']
        print(f"  {i+1}. Image: {payload.get('image_id', 'unknown')}")
        print(f"      Similarity Score: {result['score']:.4f}")
        print(f"      IoU Score: {payload.get('IoU_score', 'N/A')}")
        print(f"      Predicted Classes: {payload.get('predicted_classes', [])}")
    
    return results


def main(test_images_dir=None, test_masks_dir=None, model_path=None, 
         store_qdrant=True, analyze_failures_flag=False):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    test_images_dir = test_images_dir or config.TEST_IMAGES_DIR
    test_masks_dir = test_masks_dir or config.TEST_MASKS_DIR
    model_path = model_path or config.MODEL_PATH
    
    if not os.path.exists(test_images_dir):
        raise FileNotFoundError(f"Test images directory not found: {test_images_dir}")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    
    print(f"Loading test dataset from: {test_images_dir}")
    test_dataset = OffRoadDataset(test_images_dir, test_masks_dir, config.IMAGE_SIZE, 
                               train=False, augment=False)
    test_loader = DataLoader(test_dataset, batch_size=config.BATCH_SIZE, shuffle=False,
                            num_workers=2, pin_memory=True)
    print(f"Test samples: {len(test_dataset)}")
    
    print(f"Loading model from: {model_path}")
    model = load_model(model_path, device)
    
    qdrant_manager = None
    embedder_model = None
    
    if store_qdrant:
        try:
            qdrant_manager = QdrantManager(
                host=config.QDRANT_HOST,
                port=config.QDRANT_PORT,
                collection_name=config.QDRANT_COLLECTION,
                embedding_dim=config.EMBEDDING_DIM
            )
            
            from embedder import Embedder
            embedder_model = Embedder(
                model_name=config.MODEL_NAME,
                embedding_dim=config.EMBEDDING_DIM
            )
            embedder_model = embedder_model.to(device)
            embedder_model.eval()
            
            print(f"Qdrant collection '{config.QDRANT_COLLECTION}' initialized")
        except Exception as e:
            print(f"Warning: Qdrant not available: {e}")
            qdrant_manager = None
    
    compute_gt = os.path.exists(test_masks_dir)
    mean_iou, predictions = process_test_images(
        model, test_loader, device,
        qdrant_manager=qdrant_manager if store_qdrant else None,
        embedder_model=embedder_model if store_qdrant else None,
        save_dir="predictions",
        compute_iou_flag=compute_gt
    )
    
    if analyze_failures_flag and qdrant_manager:
        analyze_failures(qdrant_manager)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--test-images', type=str, default=None)
    parser.add_argument('--test-masks', type=str, default=None)
    parser.add_argument('--model', type=str, default=None)
    parser.add_argument('--no-store-qdrant', action='store_true')
    parser.add_argument('--analyze-failures', action='store_true')
    
    args = parser.parse_args()
    
    main(
        test_images_dir=args.test_images,
        test_masks_dir=args.test_masks,
        model_path=args.model,
        store_qdrant=not args.no_store_qdrant,
        analyze_failures_flag=args.analyze_failures
    )