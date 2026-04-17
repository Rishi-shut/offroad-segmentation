
import numpy as np
import cv2
from PIL import Image

def test_get_colored_mask():
    try:
        mask_array = np.zeros((512, 512), dtype=np.uint8)
        mask_array[100:200, 100:200] = 1
        mask_array[300:400, 300:400] = 2
        
        palette_bgr = np.array([
            [0, 0, 0], [255, 162, 53], [0, 255, 0], [0, 215, 255],
            [175, 224, 244], [191, 0, 249], [0, 0, 255], [224, 224, 224],
            [255, 255, 0], [255, 0, 157]
        ], dtype=np.uint8)
        
        lut = np.zeros((256, 1, 3), dtype=np.uint8)
        lut[:10, 0, :] = palette_bgr
        
        # Test cv2.LUT
        colored_mask = cv2.LUT(mask_array, lut)
        print(f"LUT output shape: {colored_mask.shape}, dtype: {colored_mask.dtype}")
        
        # Test GaussianBlur
        glow = cv2.GaussianBlur(colored_mask, (7, 7), 0)
        print(f"Glow output shape: {glow.shape}")
        
        # Test addWeighted
        final_mask = cv2.addWeighted(colored_mask, 0.7, glow, 0.3, 0)
        print(f"Final output shape: {final_mask.shape}")
        
        final_rgb = cv2.cvtColor(final_mask, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(final_rgb)
        print("Success! Image created.")
        
    except Exception as e:
        print(f"FAILED with error: {e}")

if __name__ == "__main__":
    test_get_colored_mask()
