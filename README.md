# Off-Road Semantic Segmentation with Qdrant Vector Database

A production-ready semantic segmentation project for off-road desert environments using SegFormer, with an intelligent retrieval system using Qdrant vector database for similarity search and failure case analysis.

## Features

- **SegFormer Model**: Pretrained SegFormer (B2) fine-tuned for 10-class off-road segmentation
- **Mixed Precision Training**: FP16 mixed precision for faster training
- **Early Stopping**: Prevent overfitting with patience-based stopping
- **Gradient Clipping**: Stable training with gradient norm clipping
- **Qdrant Integration**: Vector database for storing embeddings and similarity search
- **Failure Analysis**: Identify and retrieve similar failure cases

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Dataset Structure

```
data/
├── train/
│   ├── images/
│   │   ├── image_001.png
│   │   └── ...
│   └── masks/
│       ├── image_001.png
│       └── ...
├── val/
│   ├── images/
│   └── masks/
└── test/
    ├── images/
    └── masks/
```

### 3. Qdrant Setup

Start Qdrant server locally:

```bash
docker run -d -p 6333:6333 qdrant/qdrant
```

Or use the Python client in embedded mode (no server required).

## Label Mapping

Original labels are remapped to 0-9:

| Original | Remapped | Class Name   |
|----------|---------|--------------|
| 100      | 0        | background   |
| 200      | 1        | road         |
| 300      | 2        | vegetation  |
| 500      | 3        | gravel      |
| 550      | 4        | sand        |
| 600      | 5        | rock        |
| 700      | 6        | obstacle    |
| 800      | 7        | trail       |
| 7100     | 8        | water       |
| 10000    | 9        | other       |

## Training

Edit `config.py` to set hyperparameters if needed:

```python
IMAGE_SIZE = 512
BATCH_SIZE = 4
LEARNING_RATE = 5e-5
EPOCHS = 30
NUM_CLASSES = 10
```

Run training:

```bash
python train.py
```

The best model is saved as `best_model.pth` based on validation IoU.

## Testing

Run inference on test images:

```bash
python test.py
```

With Qdrant storage enabled (default):

```bash
python test.py --test-images data/test/images --test-masks data/test/masks
```

Disable Qdrant storage:

```bash
python test.py --no-store-qdrant
```

Analyze failure cases:

```bash
python test.py --analyze-failures
```

Output examples:

```
Test Results:
  Mean IoU: 0.7234

Searching for similar scenes...
 Top 3 similar scenes found:
  1. Image: test_042
      Similarity Score: 0.9234
      IoU Score: 0.68
      Predicted Classes: [1, 2, 3, 5]
  2. Image: test_017
      Similarity Score: 0.8912
      IoU Score: 0.72
      Predicted Classes: [1, 2, 4]
  3. Image: test_103
      Similarity Score: 0.8745
      IoU Score: 0.65
      Predicted Classes: [1, 2, 3, 6]
```

## Qdrant Usage

### Why Qdrant?

Qdrant is a high-performance vector database that enables:

1. **Semantic Retrieval**: Find similar scenes based on learned embeddings
2. **Failure Analysis**: Identify patterns in failed predictions
3. **Data Augmentation**: Similar images can be used for targeted data collection
4. **Model Debugging**: Understand which scenes cause poor performance

### API

```python
from qdrant_utils import create_qdrant_manager
from embedder import create_embedder

# Create manager
qdrant = create_qdrant_manager(
    host="localhost",
    port=6333,
    collection_name="segmentation_memory",
    embedding_dim=768
)

# Insert embedding with metadata
qdrant.insert_embedding(
    embedding_vector,
    {
        'image_id': 'sample_001',
        'predicted_classes': [1, 2, 3],
        'IoU_score': 0.75
    }
)

# Search similar
results = qdrant.search_similar(
    query_vector=embedding,
    top_k=5
)

# Filter failures
failures = qdrant.search_by_filter(
    filter_conditions={'IoU_score': {'$lt': 0.5}},
    top_k=10
)
```

## Configuration

Key parameters in `config.py`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| IMAGE_SIZE | 512 | Input image resolution |
| BATCH_SIZE | 4 | Training batch size |
| LEARNING_RATE | 5e-5 | Initial learning rate |
| EPOCHS | 30 | Maximum training epochs |
| NUM_CLASSES | 10 | Number of segmentation classes |
| PATIENCE | 10 | Early stopping patience |
| GRADIENT_CLIP | 1.0 | Gradient clipping threshold |
| USE_AMP | True | Enable mixed precision |

## Project Structure

```
.
├── dataset.py       # Custom dataset with augmentations
├── config.py        # Hyperparameters
├── train.py        # Training loop
├── test.py         # Inference with Qdrant
├── utils.py        # IoU and visualization
├── embedder.py     # Embedding extraction
├── qdrant_utils.py # Vector database utilities
├── requirements.txt
└── README.md
```

## Visualization

Generate visualizations:

```python
from utils import visualize_mask, visualize_overlay

# Save predicted mask
visualize_mask(pred_mask, save_path='pred.png')

# Overlay on original image
visualize_overlay(image, pred_mask, save_path='overlay.png')
```

## Notes

- Model uses ADE-20K pretrained weights from `nvidia/segformer-b2-finetuned-ade-512-512`
- Label remapping ensures compatibility with 10-class output
- Qdrant can run in-memory mode if server is unavailable
- Embeddings are normalized (L2) for cosine similarity search