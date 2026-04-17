import os
import numpy as np
from PIL import Image
import torch
from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor
import albumentations as A
from albumentations.pytorch import ToTensorV2


MODEL_NAME = "nvidia/segformer-b2-finetuned-ade-512-512"
IMAGE_SIZE = 512
NUM_CLASSES = 10


class SegmentationModel:
    def __init__(self, model_path: str = None, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.image_size = IMAGE_SIZE
        self.num_classes = NUM_CLASSES
        
        self.processor = SegformerImageProcessor.from_pretrained(MODEL_NAME)
        
        if model_path and os.path.exists(model_path):
            self.model = SegformerForSemanticSegmentation.from_pretrained(
                MODEL_NAME,
                num_labels=NUM_CLASSES,
                ignore_mismatched_sizes=True
            )
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.to(self.device)
            self.model.eval()
            print(f"Loaded model from {model_path}")
        else:
            self.model = None
            print(f"Warning: Model not loaded, using dummy predictions")
        
        self.transform = self._get_transform()
        
        try:
            from embedder import Embedder
            self.embedder = Embedder(embedding_dim=768)
            self.embedder.to(self.device)
            self.embedder.eval()
        except:
            self.embedder = None
    
    def _get_transform(self):
        return A.Compose([
            A.Resize(self.image_size, self.image_size),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])
    
    def _preprocess(self, image: Image.Image):
        img_array = np.array(image.convert('RGB'))
        transformed = self.transform(image=img_array)
        return transformed['image']
    
    def predict(self, image: Image.Image):
        if self.model is None:
            return self._dummy_prediction(image)
        
        processed = self._preprocess(image)
        processed = processed.unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(processed).logits
            
            upsampled = torch.nn.functional.interpolate(
                outputs,
                size=(self.image_size, self.image_size),
                mode='bilinear',
                align_corners=False
            )
            
            pred_mask = upsampled.argmax(dim=1).squeeze(0)
        
        mask_array = pred_mask.cpu().numpy().astype(np.uint8)
        
        return Image.fromarray(mask_array), mask_array
    
    def _dummy_prediction(self, image: Image.Image):
        img = image.resize((self.image_size, self.image_size))
        mask_array = np.random.randint(0, self.num_classes, (self.image_size, self.image_size), dtype=np.uint8)
        return Image.fromarray(mask_array), mask_array
    
    def extract_embedding(self, image: Image.Image):
        if self.embedder is None:
            return np.random.randn(768)
        
        img_array = np.array(image.convert('RGB').resize((self.image_size, self.image_size)))
        
        transform = A.Compose([
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])
        
        tensor = transform(image=img_array)['image'].unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            embedding = self.embedder(tensor)
        
        return embedding.cpu().numpy().squeeze()


def load_model(model_path: str = None):
    return SegmentationModel(model_path)