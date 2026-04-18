import torch
import os
from transformers import SegformerForSemanticSegmentation

# Config
MODEL_NAME = "nvidia/segformer-b2-finetuned-ade-512-512"
PTH_PATH = "best_model.pth"
QUANT_PTH_PATH = "model_quantized.pth"
NUM_CLASSES = 10

def quantize_pytorch_model():
    print(f"--- STARTING PYTORCH DYNAMIC QUANTIZATION ---")
    
    # 1. Load Model
    model = SegformerForSemanticSegmentation.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_CLASSES,
        ignore_mismatched_sizes=True
    )
    
    checkpoint = torch.load(PTH_PATH, map_location='cpu')
    if any(k.startswith('module.') for k in checkpoint.keys()):
        checkpoint = {k.replace('module.', ''): v for k, v in checkpoint.items()}
    model.load_state_dict(checkpoint)
    model.eval()

    # 2. Apply Dynamic Quantization (INT8)
    # This specifically targets Linear and Conv layers if supported
    # For SegFormer (Transformers), Linear layers are the bulk of the weights
    print("Applying INT8 quantization to Linear layers...")
    quantized_model = torch.quantization.quantize_dynamic(
        model, 
        {torch.nn.Linear}, 
        dtype=torch.qint8
    )
    
    # 3. Save Fully (Robust for quantized structures)
    # Using time.sleep and try/except to handle Windows file locking
    import time
    time.sleep(2)
    torch.save(quantized_model, QUANT_PTH_PATH)
    
    orig_size = os.path.getsize(PTH_PATH) // 1048576
    quant_size = os.path.getsize(QUANT_PTH_PATH) // 1048576
    
    print(f"SUCCESS: Quantized model saved to {QUANT_PTH_PATH}")
    print(f"Original Size: {orig_size}MB")
    print(f"Quantized Size: {quant_size}MB")
    print(f"Reduction: {((orig_size-quant_size)/orig_size)*100:.1f}%")

if __name__ == "__main__":
    if os.path.exists(PTH_PATH):
        quantize_pytorch_model()
    else:
        print(f"ERROR: {PTH_PATH} not found.")
