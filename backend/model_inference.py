import os
import time
import numpy as np
from PIL import Image
import torch
import cv2
from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor

# Constants
MODEL_NAME = "nvidia/segformer-b2-finetuned-ade-512-512"
IMAGE_SIZE = 512
NUM_CLASSES = 10

CLASS_NAMES = [
    'Background', 'Road', 'Vegetation', 'Gravel', 'Sand', 
    'Rock', 'Obstacle', 'Trail', 'Water', 'Other'
]

# High-Intensity Atomic Palette (BGR)
PALETTE_BGR = np.array([
    [0, 0, 0],           # 0: Background
    [255, 50, 50],       # 1: Road (Blue)
    [50, 255, 50],       # 2: Vegetation (Green)
    [50, 255, 255],      # 3: Gravel (Yellow)
    [50, 150, 255],      # 4: Sand (Orange)
    [255, 50, 255],      # 5: Rock (Pink)
    [50, 50, 255],       # 6: Obstacle (Red)
    [220, 220, 220],     # 7: Trail (Silver)
    [255, 255, 50],      # 8: Water (Cyan)
    [255, 100, 150]      # 9: Other (Purple)
], dtype=np.uint8)


class SegmentationModel:
    def __init__(self, model_path: str = None, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.image_size = IMAGE_SIZE
        self.processor = SegformerImageProcessor.from_pretrained(MODEL_NAME)
        self.avg_latency = 0.0
        
        print(f"--- NEURAL GATING AUDIT ---")
        if not (model_path and os.path.exists(model_path)):
            error_msg = f"CRITICAL: Model file not found at {model_path}. Neural Engine cannot start."
            print(error_msg)
            raise FileNotFoundError(error_msg)
            
        # 1. Load the original fine-tuned weights (B2)
        print(f"Loading ORIGINAL Neural Engine: {MODEL_NAME}")
        self.model = SegformerForSemanticSegmentation.from_pretrained(
            MODEL_NAME,
            num_labels=NUM_CLASSES,
            ignore_mismatched_sizes=True
        )
        
        if model_path and os.path.exists(model_path):
            print(f"Applying checkpoint: {model_path}")
            checkpoint = torch.load(model_path, map_location=self.device)
            # Handle DataParallel prefix
            if any(k.startswith('module.') for k in checkpoint.keys()):
                checkpoint = {k.replace('module.', ''): v for k, v in checkpoint.items()}
            self.model.load_state_dict(checkpoint)
            
        self.model.to(self.device)
        self.model.eval()
        
        print(f"Neural Engine SUCCESS: Original High-Fidelity Channels ACTIVE.")
        print("-" * 30)

    def get_colored_mask(self, mask_array):
        """HUD Engine with Stroke Borders."""
        colored_bgr = PALETTE_BGR[mask_array]
        # Make the background fully transparent, and detections semi-transparent
        alpha = np.where(mask_array == 0, 0, 180).astype(np.uint8)
        bgra = cv2.merge([colored_bgr[:,:,0], colored_bgr[:,:,1], colored_bgr[:,:,2], alpha])
        
        # Draw White Border (Stroke) for high contrast
        binary = (mask_array > 0).astype(np.uint8) * 255
        edges = cv2.Canny(binary, 100, 200)
        stroke = cv2.dilate(edges, np.ones((3,3), np.uint8), iterations=1)
        bgra[stroke > 0] = [255, 255, 255, 255]
        
        rgba = cv2.cvtColor(bgra, cv2.COLOR_BGRA2RGBA)
        return Image.fromarray(rgba, 'RGBA')

    def predict(self, image: Image.Image):
        start_time = time.time()
        if self.model is None:
            return np.zeros((self.image_size, self.image_size), dtype=np.uint8)
        
        orig_w, orig_h = image.size
        inputs = self.processor(images=image.convert('RGB'), return_tensors="pt")
        pixel_values = inputs['pixel_values'].to(self.device)
        
        with torch.no_grad():
            logits = self.model(pixel_values=pixel_values).logits
            
            # --- THE NEURAL GATE (Aggressive Rebalancing) ---
            # Suppression: Make background and road quieter
            gated = logits.clone()
            gated[:, 0, :, :] -= 15.0 # Background Penalty
            gated[:, 1, :, :] -= 2.0  # Road Penalty
            
            # Amplification: Shouting the signals for Off-Road terrains 
            # We use a 5.0x multiplier to force detection of Grass, Sand, Rock, etc.
            terrains_mask = torch.ones((1, NUM_CLASSES, 1, 1), device=self.device)
            terrains_mask[:, 0:2, :, :] = 1.0 # No amp for background/road
            terrains_mask[:, 2:, :, :] = 5.0  # 5x AMP for Terrains
            
            gated = gated * terrains_mask
                
            upsampled = torch.nn.functional.interpolate(
                gated,
                size=(orig_h, orig_w),
                mode='bilinear',
                align_corners=False
            )
            pred_mask = upsampled.argmax(dim=1).squeeze(0)
        
        mask_array = pred_mask.cpu().numpy().astype(np.uint8)
        
        self.avg_latency = (time.time() - start_time) * 1000 # ms
        
        # Diagnostic Audit
        classes, counts = np.unique(mask_array, return_counts=True)
        print(f"--- DETECTED COMPOSITION ---")
        for c, count in zip(classes, counts):
            name = CLASS_NAMES[c] if c < len(CLASS_NAMES) else f"ID_{c}"
            print(f"| {name:<12} : { (count/mask_array.size)*100:>5.1f}% |")
        
        return mask_array
    
    def extract_embedding(self, image: Image.Image):
        inputs = self.processor(images=image.convert('RGB'), return_tensors="pt")
        pixel_values = inputs['pixel_values'].to(self.device)
        with torch.no_grad():
            outputs = self.model(pixel_values=pixel_values, output_hidden_states=True)
            embedding = outputs.hidden_states[-1].mean(dim=(2, 3)).squeeze().cpu().numpy()
        return embedding