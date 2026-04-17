import os
import random
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.cuda.amp import autocast, GradScaler
from transformers import SegformerForSemanticSegmentation
from tqdm import tqdm

import config
from dataset import get_dataloaders
from utils import compute_iou_from_tensors, log_iou_scores


def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


class DiceLoss(nn.Module):
    def __init__(self, smooth=1.0):
        super().__init__()
        self.smooth = smooth
    
    def forward(self, pred, target):
        pred = F.softmax(pred, dim=1)
        
        target_one_hot = F.one_hot(target, num_classes=pred.shape[1]).permute(0, 3, 1, 2).float()
        
        intersection = (pred * target_one_hot).sum(dim=(2, 3))
        union = pred.sum(dim=(2, 3)) + target_one_hot.sum(dim=(2, 3))
        
        dice = (2.0 * intersection + self.smooth) / (union + self.smooth)
        dice_loss = 1.0 - dice.mean()
        
        return dice_loss


def train_epoch(model, train_loader, optimizer, scheduler, criterion, device, scaler, epoch):
    model.train()
    total_loss = 0
    total_iou = 0
    num_batches = 0
    
    pbar = tqdm(train_loader, desc=f"Epoch {epoch+1} [Train]")
    
    for images, masks, _ in pbar:
        images = images.to(device)
        masks = masks.to(device, dtype=torch.long)
        
        optimizer.zero_grad()
        
        if config.USE_AMP:
            with autocast():
                outputs = model(images).logits
                outputs = F.interpolate(outputs, size=masks.shape[-2:], mode="bilinear", align_corners=False)
                loss = criterion(outputs, masks)
            
            scaler.scale(loss).backward()
            
            if config.GRADIENT_CLIP > 0:
                scaler.unscale_(optimizer)
                torch.nn.utils.clip_grad_norm_(model.parameters(), config.GRADIENT_CLIP)
            
            scaler.step(optimizer)
            scaler.update()
        else:
            outputs = model(images).logits
            outputs = F.interpolate(outputs, size=masks.shape[-2:], mode="bilinear", align_corners=False)
            loss = criterion(outputs, masks)
            
            loss.backward()
            
            if config.GRADIENT_CLIP > 0:
                torch.nn.utils.clip_grad_norm_(model.parameters(), config.GRADIENT_CLIP)
            
            optimizer.step()
        
        scheduler.step()
        
        with torch.no_grad():
            pred_labels = outputs.argmax(dim=1)
            mean_iou, _ = compute_iou_from_tensors(pred_labels, masks, config.NUM_CLASSES)
        
        total_loss += loss.item()
        total_iou += mean_iou
        num_batches += 1
        
        pbar.set_postfix({'loss': f'{loss.item():.4f}', 'iou': f'{mean_iou:.4f}'})
    
    avg_loss = total_loss / num_batches
    avg_iou = total_iou / num_batches
    
    return avg_loss, avg_iou


def validate_epoch(model, val_loader, criterion, device):
    model.eval()
    total_loss = 0
    all_ious = []
    all_pred_labels = []
    all_masks = []
    num_batches = 0
    
    pbar = tqdm(val_loader, desc="Validation")
    
    with torch.no_grad():
        for images, masks, _ in pbar:
            images = images.to(device)
            masks = masks.to(device, dtype=torch.long)
            
            outputs = model(images).logits
            outputs = F.interpolate(outputs, size=masks.shape[-2:], mode="bilinear", align_corners=False)
            loss = criterion(outputs, masks)
            
            pred_labels = outputs.argmax(dim=1)
            mean_iou, iou_per_class = compute_iou_from_tensors(pred_labels, masks, config.NUM_CLASSES)
            
            total_loss += loss.item()
            all_ious.append(mean_iou)
            all_pred_labels.append(pred_labels)
            all_masks.append(masks)
            num_batches += 1
            
            pbar.set_postfix({'loss': f'{loss.item():.4f}', 'iou': f'{mean_iou:.4f}'})
    
    avg_loss = total_loss / num_batches
    avg_iou = np.mean(all_ious)
    
    return avg_loss, avg_iou, all_pred_labels, all_masks


def main():
    set_seed(config.SEED)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    if not os.path.exists(config.TRAIN_IMAGES_DIR):
        raise FileNotFoundError(f"Training images directory not found: {config.TRAIN_IMAGES_DIR}")
    if not os.path.exists(config.VAL_IMAGES_DIR):
        raise FileNotFoundError(f"Validation images directory not found: {config.VAL_IMAGES_DIR}")
    
    print(" Loading datasets...")
    train_loader, val_loader = get_dataloaders(
        config.TRAIN_IMAGES_DIR, config.TRAIN_MASKS_DIR,
        config.VAL_IMAGES_DIR, config.VAL_MASKS_DIR,
        batch_size=config.BATCH_SIZE,
        image_size=config.IMAGE_SIZE
    )
    print(f" Train samples: {len(train_loader.dataset)}, Val samples: {len(val_loader.dataset)}")
    
    print(f" Loading SegFormer model: {config.MODEL_NAME}")
    model = SegformerForSemanticSegmentation.from_pretrained(
        config.MODEL_NAME,
        num_labels=config.NUM_CLASSES,
        ignore_mismatched_sizes=True
    )
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss(ignore_index=255)
    
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config.LEARNING_RATE,
        weight_decay=0.01
    )
    
    total_steps = len(train_loader) * config.EPOCHS
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer,
        T_max=total_steps,
        eta_min=1e-6
    )
    
    scaler = GradScaler() if config.USE_AMP else None
    
    best_iou = 0.0
    patience_counter = 0
    start_epoch = 0
    
    if hasattr(config, 'CHECKPOINT_PATH') and os.path.exists(config.CHECKPOINT_PATH):
        print(f"  Loading checkpoint from {config.CHECKPOINT_PATH}...")
        try:
            checkpoint = torch.load(config.CHECKPOINT_PATH, map_location=device, weights_only=False)
            model.load_state_dict(checkpoint['model_state_dict'])
            optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
            scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
            if scaler and 'scaler_state_dict' in checkpoint:
                scaler.load_state_dict(checkpoint['scaler_state_dict'])
            start_epoch = checkpoint['epoch'] + 1
            best_iou = checkpoint.get('best_iou', 0.0)
            patience_counter = checkpoint.get('patience_counter', 0)
            print(f"  Resuming from epoch {start_epoch + 1}")
        except Exception as e:
            print(f"  Warning: Failed to load checkpoint. Corrupted file? Error: {e}")
            print("  Starting training from scratch...")
    
    for epoch in range(start_epoch, config.EPOCHS):
        print(f"\n{'='*60}")
        print(f"Epoch {epoch+1}/{config.EPOCHS}")
        print(f"{'='*60}")
        
        train_loss, train_iou = train_epoch(
            model, train_loader, optimizer, scheduler, criterion, device, scaler, epoch
        )
        
        val_loss, val_iou, _, _ = validate_epoch(
            model, val_loader, criterion, device
        )
        
        print(f"\n Epoch {epoch+1} Summary:")
        print(f"  Train Loss: {train_loss:.4f}, Train IoU: {train_iou:.4f}")
        print(f"  Val Loss: {val_loss:.4f}, Val IoU: {val_iou:.4f}")
        
        if val_iou > best_iou:
            best_iou = val_iou
            torch.save(model.state_dict(), config.MODEL_PATH)
            print(f"  Saved best model with IoU: {best_iou:.4f}")
            patience_counter = 0
        else:
            patience_counter += 1
            print(f"  No improvement. Patience: {patience_counter}/{config.PATIENCE}")
        
        if patience_counter >= config.PATIENCE:
            print(f"\n Early stopping at epoch {epoch+1}")
            break
            
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'scheduler_state_dict': scheduler.state_dict(),
            'best_iou': best_iou,
            'patience_counter': patience_counter,
        }
        if scaler:
            checkpoint['scaler_state_dict'] = scaler.state_dict()
        if hasattr(config, 'CHECKPOINT_PATH'):
            torch.save(checkpoint, config.CHECKPOINT_PATH)
    
    print(f"\n Training complete! Best validation IoU: {best_iou:.4f}")


if __name__ == "__main__":
    main()