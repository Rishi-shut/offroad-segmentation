try:
    import torch
    print("Torch Success")
    import onnx
    print("ONNX Success")
    import onnxruntime
    print("ONNXRuntime Success")
    from onnxruntime.quantization import quantize_dynamic
    print("Quantization Success")
except Exception as e:
    print(f"FAILED: {e}")
