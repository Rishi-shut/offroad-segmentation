import torch
from transformers import SegformerForSemanticSegmentation

MODEL_NAME = "nvidia/segformer-b2-finetuned-ade-512-512"
QUANT_PTH_PATH = "model_quantized.pth"
NUM_CLASSES = 10

try:
    # 1. Init empty model
    model = SegformerForSemanticSegmentation.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_CLASSES,
        ignore_mismatched_sizes=True
    )
    
    # 2. Apply quantization structure
    model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )
    
    # 3. Load weights
    state_dict = torch.load(QUANT_PTH_PATH, map_location='cpu')
    model.load_state_dict(state_dict)
    model.eval()
    
    print("SUCCESS: Model loaded correctly")
    
    # Check RAM roughly
    import psutil
    import os
    process = psutil.Process(os.getpid())
    print(f"RAM Usage: {process.memory_info().rss / 1024 / 1024:.2f} MB")

except Exception as e:
    print(f"FAILED: {e}")
