import numpy as np
import torch
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from pathlib import Path


CLASS_NAMES = [
    'background (100)', 'road (200)', 'vegetation (300)', 'gravel (500)', 'sand (550)', 
    'rock (600)', 'obstacle (700)', 'trail (800)', 'water (7100)', 'other (10000)'
]

COLOR_PALETTE = [
    [0, 0, 0],         # background: deep black
    [53, 162, 255],    # road: electric blue
    [0, 255, 0],       # vegetation: neon green
    [255, 215, 0],     # gravel: golden amber
    [244, 224, 175],   # sand: desert yellow
    [249, 0, 191],     # rock: hot pink
    [255, 0, 0],       # obstacle: bright red
    [224, 224, 224],   # trail: silver/white
    [0, 255, 255],     # water: deep cyan
    [157, 0, 255]      # other: purple haze
]


def batch_iou(pred, target, num_classes=10, ignore_index=255):
    pred = pred.view(-1)
    target = target.view(-1)
    
    mask = (target != ignore_index)
    pred = pred[mask]
    target = target[mask]
    
    iou_per_class = []
    
    for cls in range(num_classes):
        pred_cls = pred == cls
        target_cls = target == cls
        
        intersection = (pred_cls & target_cls).sum().float()
        union = (pred_cls | target_cls).sum().float()
        
        if union == 0:
            iou_per_class.append(float('nan'))
        else:
            iou_per_class.append((intersection / union).item())
    
    return iou_per_class


def compute_iou(pred, target, num_classes=10, ignore_index=255):
    if isinstance(pred, torch.Tensor):
        pred = pred.cpu().numpy()
    if isinstance(target, torch.Tensor):
        target = target.cpu().numpy()
    
    pred = pred.flatten()
    target = target.flatten()
    
    iou_per_class = []
    
    for cls in range(num_classes):
        pred_cls = (pred == cls)
        target_cls = (target == cls)
        
        intersection = np.logical_and(pred_cls, target_cls).sum()
        union = np.logical_or(pred_cls, target_cls).sum()
        
        if union == 0:
            iou_per_class.append(float('nan'))
        else:
            iou_per_class.append(intersection / union)
    
    valid_ious = [iou for iou in iou_per_class if not np.isnan(iou)]
    mean_iou = np.mean(valid_ious) if valid_ious else 0.0
    
    return mean_iou, iou_per_class


def compute_iou_from_tensors(pred, target, num_classes=10, ignore_index=255):
    if len(pred.shape) == 4:
        pred = pred.argmax(dim=1)
    if len(target.shape) == 4:
        target = target.argmax(dim=1)
    
    pred = pred.view(-1)
    target = target.view(-1)
    
    mask = (target != ignore_index)
    pred = pred[mask]
    target = target[mask]
    
    iou_per_class = []
    
    for cls in range(num_classes):
        pred_cls = pred == cls
        target_cls = target == cls
        
        intersection = (pred_cls & target_cls).sum().float()
        union = (pred_cls | target_cls).sum().float()
        
        if union == 0:
            iou_per_class.append(float('nan'))
        else:
            iou_per_class.append((intersection / union).item())
    
    valid_ious = [iou for iou in iou_per_class if not np.isnan(iou)]
    mean_iou = np.mean(valid_ious) if valid_ious else 0.0
    
    return mean_iou, iou_per_class


def visualize_mask(mask, save_path=None, title=None):
    h, w = mask.shape
    color_mask = np.zeros((h, w, 3), dtype=np.uint8)
    
    for idx, color in enumerate(COLOR_PALETTE):
        color_mask[mask == idx] = color
    
    plt.figure(figsize=(10, 10))
    plt.imshow(color_mask)
    if title:
        plt.title(title)
    plt.axis('off')
    
    if save_path:
        plt.savefig(save_path, bbox_inches='tight', dpi=150)
    else:
        plt.show()
    
    plt.close()


def visualize_overlay(image, mask, alpha=0.5, save_path=None, title=None):
    if isinstance(image, torch.Tensor):
        image = image.cpu().numpy()
    if len(image.shape) == 3 and image.shape[0] == 3:
        image = np.transpose(image, (1, 2, 0))
    
    image = (image - image.min()) / (image.max() - image.min() + 1e-8)
    
    h, w = mask.shape
    color_mask = np.zeros((h, w, 3), dtype=np.uint8)
    
    for idx, color in enumerate(COLOR_PALETTE):
        color_mask[mask == idx] = color
    
    overlay = (image * 255 * (1 - alpha) + color_mask * alpha).astype(np.uint8)
    
    plt.figure(figsize=(15, 5))
    
    plt.subplot(1, 3, 1)
    plt.imshow(image)
    plt.title('Input Image')
    plt.axis('off')
    
    plt.subplot(1, 3, 2)
    plt.imshow(color_mask)
    plt.title('Predicted Mask')
    plt.axis('off')
    
    plt.subplot(1, 3, 3)
    plt.imshow(overlay)
    plt.title('Overlay')
    plt.axis('off')
    
    if title:
        plt.suptitle(title)
    
    if save_path:
        plt.savefig(save_path, bbox_inches='tight', dpi=150)
    else:
        plt.show()
    
    plt.close()


def log_iou_scores(mean_iou, iou_per_class, epoch=None):
    prefix = f"Epoch {epoch} - " if epoch is not None else ""
    
    print(f"\n{prefix}Mean IoU: {mean_iou:.4f}")
    print("\nPer-class IoU:")
    
    for cls in range(len(iou_per_class)):
        iou_val = iou_per_class[cls]
        if np.isnan(iou_val):
            print(f"  Class {cls} ({CLASS_NAMES[cls]}): N/A")
        else:
            print(f"  Class {cls} ({CLASS_NAMES[cls]}): {iou_val:.4f}")


def save_prediction(pred_mask, save_path):
    pred_mask = pred_mask.astype(np.uint8)
    Image.fromarray(pred_mask).save(save_path)


from PIL import Image