import os


IMAGE_SIZE = 512
BATCH_SIZE = 4
LEARNING_RATE = 5e-5
EPOCHS = 30
NUM_CLASSES = 10


MODEL_NAME = "nvidia/segformer-b2-finetuned-ade-512-512"
MODEL_PATH = "best_model.pth"


TRAIN_IMAGES_DIR = "data/train/images"
TRAIN_MASKS_DIR = "data/train/masks"
VAL_IMAGES_DIR = "data/val/images"
VAL_MASKS_DIR = "data/val/masks"
TEST_IMAGES_DIR = "data/test/images"
TEST_MASKS_DIR = "data/test/masks"


DEVICE = "cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu"


PATIENCE = 10
GRADIENT_CLIP = 1.0
USE_AMP = True


SEED = 42


QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
QDRANT_COLLECTION = "segmentation_memory"
EMBEDDING_DIM = 768