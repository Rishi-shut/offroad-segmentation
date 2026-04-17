import os
import numpy as np
from PIL import Image
import torch
import cv2
from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor

# Constants
MODEL_NAME = "nvidia/segformer-b2-finetuned-ade-512-512"
IMAGE_SIZE = 512
NUM_CLASSES = 10

# Hardcoded Mappings for Zero-Dependency Performance
CLASS_NAMES = [
    'Background', 'Road', 'Vegetation', 'Gravel', 'Sand', 
    'Rock', 'Obstacle', 'Trail', 'Water', 'Other'
]

# High-Contrast Industrial Palette (BGR for OpenCV)
PALETTE_BGR = np.array([
    [0, 0, 0],         # 0: Background (Black)
    [255, 0, 0],       # 1: Road (Pure Blue)
    [0, 255, 0],       # 2: Vegetation (Neon Green)
    [0, 255, 255],     # 3: Gravel (Neon Yellow)
    [0, 165, 255],     # 4: Sand (Vibrant Orange)
    [255, 0, 255],     # 5: Rock (Hot Pink)
    [0, 0, 255],       # 6: Obstacle (Pure Red)
    [200, 200, 200],   # 7: Trail (Bright Silver)
    [255, 255, 0],     # 8: Water (Electric Cyan)
    [128, 0, 255]      # 9: Other (Electric Purple)
], dtype=np.uint8)


class SegmentationModel:
    def __init__(self, model_path: str = None, device: str = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.image_size = IMAGE_SIZE
        self.num_classes = NUM_CLASSES
        
        # Load Official Processor
        self.processor = SegformerImageProcessor.from_pretrained(MODEL_NAME)
        
        # Load Model
        if model_path and os.path.exists(model_path):
            self.model = SegformerForSemanticSegmentation.from_pretrained(
                MODEL_NAME,
                num_labels=NUM_CLASSES,
                ignore_mismatched_sizes=True
            )
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            self.model.to(self.device)
            self.model.eval()
            print(f"Neural Engine Initialized: {model_path} on {self.device}")
        else:
            self.model = None
            print(f"Warning: Offline Engine - using dummy predictions")

    def get_colored_mask(self, mask_array):
        """Ultra-Fast Industrial Coloring Engine."""
        # Vectorized palette mapping (NumPy)
        colored_mask = PALETTE_BGR[mask_array]
        
        # Professional Edge Softening (Tiny 3x3 kernel for speed)
        final_mask = cv2.GaussianBlur(colored_mask, (3, 3), 0)
        
        # BGR -> RGB for Frontend
        final_rgb = cv2.cvtColor(final_mask, cv2.COLOR_BGR2RGB)
        return Image.fromarray(final_rgb)

    def predict(self, image: Image.Image):
        if self.model is None:
            return self._dummy_prediction(image)
        
        # 1. Preprocess
        inputs = self.processor(images=image.convert('RGB'), return_tensors="pt")
        pixel_values = inputs['pixel_values'].to(self.device)
        
        # 2. Inference with Sensitizer
        with torch.no_grad():
            outputs = self.model(pixel_values=pixel_values).logits
            
            # Neural Sensitizer: Penalize Background(0) and Road(1) to reveal Grass/Rock/Sand
            bias = torch.zeros_like(outputs)
            bias[:, 0, :, :] = -2.5 
            bias[:, 1, :, :] = -1.5 
            
            # Upsample and Apply argmax
            upsampled = torch.nn.functional.interpolate(
                outputs + bias,
                size=(self.image_size, self.image_size),
                mode='bilinear',
                align_corners=False
            )
            pred_mask = upsampled.argmax(dim=1).squeeze(0)
        
        mask_array = pred_mask.cpu().numpy().astype(np.uint8)
        
        # 3. High-Speed Neural Audit (Diagnostic)
        classes, counts = np.unique(mask_array, return_counts=True)
        total = mask_array.size
        print(f"--- TERRAIN AUDIT ---")
        for c, count in zip(classes, counts):
            name = CLASS_NAMES[c] if c < len(CLASS_NAMES) else f"ID_{c}"
            print(f"| {name:<12} : { (count/total)*100:>5.1f}% |")
        
        return mask_array
    
    def _dummy_prediction(self, image: Image.Image):
        return np.random.randint(0, self.num_classes, (self.image_size, self.image_size), dtype=np.uint8)

    def extract_embedding(self, image: Image.Image):
        """Fast Feature Embedding for Vector Storage."""
        inputs = self.processor(images=image.convert('RGB'), return_tensors="pt")
        pixel_values = inputs['pixel_values'].to(self.device)
        with torch.no_grad():
            outputs = self.model(pixel_values=pixel_values, output_hidden_states=True)
            # Use mean pooled last hidden state as embedding
            embedding = outputs.hidden_states[-1].mean(dim=(2, 3)).squeeze().cpu().numpy()
        return embedding