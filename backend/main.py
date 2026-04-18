from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
import numpy as np
from PIL import Image
import io
import base64

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
except ImportError:
    pass  # python-dotenv not installed; rely on system env vars

from model_inference import SegmentationModel
from database import QdrantManager, PostgreSQLManager, SQLiteManager

app = FastAPI(title="Off-Road Segmentation API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

segmentation_model = None
qdrant_manager = None
db_manager = None  # Can be PostgreSQL or SQLite


@app.on_event("startup")
async def startup_event():
    global segmentation_model, qdrant_manager, db_manager
    
    # -- Neural Engine --
    model_path = os.environ.get("MODEL_PATH", "best_model.pth")
    try:
        segmentation_model = SegmentationModel(model_path)
    except Exception as e:
        print(f"CRITICAL Error initializing Neural Engine: {e}")
        segmentation_model = None
    
    # -- Database --
    neon_url = os.environ.get("DATABASE_URL")
    
    # -- Qdrant Vector DB --
    qdrant_url = os.environ.get("QDRANT_URL")
    qdrant_api_key = os.environ.get("QDRANT_API_KEY")
    
    if qdrant_url:
        qdrant_manager = QdrantManager(url=qdrant_url, api_key=qdrant_api_key)
    else:
        qdrant_manager = QdrantManager()
    
    # -- SQL Database (PostgreSQL with SQLite fallback) --
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        try:
            db_manager = PostgreSQLManager(db_url)
            await db_manager.create_tables()
            print("Connected to PostgreSQL")
        except Exception as e:
            print(f"PostgreSQL failed ({e}), falling back to SQLite")
            db_manager = SQLiteManager()
            db_manager.create_tables()
    else:
        print("No DATABASE_URL set, using SQLite")
        db_manager = SQLiteManager()
        db_manager.create_tables()


@app.on_event("shutdown")
async def shutdown_event():
    if db_manager and hasattr(db_manager, 'close'):
        try:
            await db_manager.close()
        except TypeError:
            db_manager.close()  # SQLite close is synchronous


# ==========================================
# Response Models
# ==========================================

class PredictionResponse(BaseModel):
    image_id: str
    mask_base64: str
    classes: List[int]
    confidence: Optional[float] = None


class SimilarResponse(BaseModel):
    image_id: str
    score: float
    predicted_classes: List[int]
    iou_score: Optional[float] = None


class UserPrediction(BaseModel):
    id: Optional[int] = None
    user_id: str
    image_name: str
    predicted_classes: List[int]
    iou_score: Optional[float] = None
    created_at: Optional[str] = None


class FrameInput(BaseModel):
    """Accepts a base64-encoded frame for segmentation."""
    frame_base64: str
    frame_name: Optional[str] = "frame.png"


class EmbeddingInput(BaseModel):
    """Accepts a vector + metadata to store in Qdrant."""
    image_id: str
    vector: List[float]
    metadata: Optional[dict] = {}


# ==========================================
# Endpoints
# ==========================================

@app.get("/")
async def root():
    return {"message": "Off-Road Segmentation API", "version": "2.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    model_loaded = segmentation_model is not None
    return {
        "status": "healthy",
        "model_loaded": model_loaded,
        "qdrant_connected": qdrant_manager is not None and qdrant_manager.client is not None,
        "db_connected": db_manager is not None
    }


# -- Predict from uploaded image file --
@app.post("/predict/", response_model=PredictionResponse)
async def predict(image: UploadFile = File(...), user_id: Optional[str] = None):
    """Original prediction endpoint. Accepts a multipart image upload."""
    if segmentation_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')
        
        mask_array = segmentation_model.predict(img)
        mask_colored = segmentation_model.get_colored_mask(mask_array)
        
        buffer = io.BytesIO()
        mask_colored.save(buffer, format="PNG")
        mask_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        unique_classes = sorted(np.unique(mask_array).tolist())
        
        # Store embedding in Qdrant
        if qdrant_manager and qdrant_manager.client:
            try:
                # Use the new high-performance extraction method
                embedding = segmentation_model.extract_embedding(img)
                payload = {
                    "image_id": image.filename,
                    "predicted_classes": unique_classes,
                    "user_id": user_id,
                }
                qdrant_manager.insert_embedding(embedding, payload)
            except Exception as e:
                print(f"Qdrant insertion error: {e}")
        
        # Save prediction to SQL database
        if db_manager and user_id:
            try:
                if hasattr(db_manager, 'save_prediction'):
                    if isinstance(db_manager, PostgreSQLManager):
                        await db_manager.save_prediction(
                            user_id=user_id,
                            image_name=image.filename,
                            predicted_classes=unique_classes
                        )
                    else:
                        db_manager.save_prediction(
                            user_id=user_id,
                            image_name=image.filename,
                            predicted_classes=unique_classes
                        )
            except Exception as e:
                print(f"DB save error: {e}")
        
        return PredictionResponse(
            image_id=image.filename,
            mask_base64=mask_base64,
            classes=unique_classes
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -- Alias endpoint with clearer naming --
@app.post("/predict-image/", response_model=PredictionResponse)
async def predict_image(image: UploadFile = File(...), user_id: Optional[str] = None):
    """Alias for /predict/ with clearer naming."""
    return await predict(image=image, user_id=user_id)


# -- Predict from a base64-encoded video frame --
@app.post("/predict-frame/", response_model=PredictionResponse)
async def predict_frame(frame_input: FrameInput):
    """Accepts a base64-encoded frame and returns segmentation results."""
    if segmentation_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Decode base64 frame to PIL Image
        frame_bytes = base64.b64decode(frame_input.frame_base64)
        img = Image.open(io.BytesIO(frame_bytes)).convert('RGB')
        
        mask_array = segmentation_model.predict(img)
        mask_colored = segmentation_model.get_colored_mask(mask_array)
        
        buffer = io.BytesIO()
        mask_colored.save(buffer, format="PNG")
        mask_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        unique_classes = sorted(np.unique(mask_array).tolist())
        
        return PredictionResponse(
            image_id=frame_input.frame_name,
            mask_base64=mask_base64,
            classes=unique_classes
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -- Store an embedding in Qdrant --
@app.post("/store-embedding/")
async def store_embedding(embedding_input: EmbeddingInput):
    """Manually store a vector embedding in the Qdrant vector database."""
    if qdrant_manager is None or qdrant_manager.client is None:
        raise HTTPException(status_code=503, detail="Qdrant not connected")
    
    try:
        vector = np.array(embedding_input.vector, dtype=np.float32)
        payload = {
            "image_id": embedding_input.image_id,
            **embedding_input.metadata
        }
        point_id = qdrant_manager.insert_embedding(vector, payload)
        return {"status": "stored", "point_id": point_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -- Batch predict (existing) --
@app.post("/predict/batch/", response_model=List[PredictionResponse])
async def predict_batch(images: List[UploadFile] = File(...)):
    if segmentation_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    results = []
    
    for image in images:
        try:
            contents = await image.read()
            img = Image.open(io.BytesIO(contents)).convert('RGB')
            
            mask_array = segmentation_model.predict(img)
            mask_colored = segmentation_model.get_colored_mask(mask_array)
            
            buffer = io.BytesIO()
            mask_colored.save(buffer, format="PNG")
            mask_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            unique_classes = sorted(np.unique(mask_array).tolist())
            
            results.append(PredictionResponse(
                image_id=image.filename,
                mask_base64=mask_base64,
                classes=unique_classes
            ))
        except Exception as e:
            print(f"Error processing {image.filename}: {e}")
    
    return results


# -- Similar scenes (existing) --
@app.get("/similar/{image_id}", response_model=List[SimilarResponse])
async def get_similar_scenes(image_id: str, top_k: int = 5):
    if qdrant_manager is None or qdrant_manager.client is None:
        raise HTTPException(status_code=503, detail="Qdrant not connected")
    
    try:
        all_points = qdrant_manager.get_all_points(limit=1000)
        
        target_point = None
        for point in all_points:
            if point.get('id') == image_id or point.get('payload', {}).get('image_id') == image_id:
                target_point = point
                break
        
        if not target_point:
            raise HTTPException(status_code=404, detail="Image not found in database")
        
        target_embedding = target_point.get('vector')
        if not target_embedding:
            raise HTTPException(status_code=400, detail="No embedding found for image")
        
        results = qdrant_manager.search_similar(
            query_vector=np.array(target_embedding),
            top_k=top_k + 1
        )
        
        similar_results = []
        for r in results:
            if r.get('id') != image_id:
                payload = r.get('payload', {})
                similar_results.append(SimilarResponse(
                    image_id=payload.get('image_id', r.get('id')),
                    score=r.get('score', 0.0),
                    predicted_classes=payload.get('predicted_classes', []),
                    iou_score=payload.get('iou_score')
                ))
        
        return similar_results[:top_k]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -- User history (existing) --
@app.get("/history/{user_id}", response_model=List[UserPrediction])
async def get_user_history(user_id: str, limit: int = 20):
    if db_manager is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        if isinstance(db_manager, PostgreSQLManager):
            predictions = await db_manager.get_user_predictions(user_id, limit=limit)
        else:
            predictions = db_manager.get_user_predictions(user_id, limit=limit)
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -- Stats --
@app.get("/stats/")
async def get_stats():
    stats = {
        "total_predictions": 0, 
        "qdrant_points": 0,
        "device": segmentation_model.device if segmentation_model else "unknown",
        "model": "SegFormer-B2",
        "avg_latency": getattr(segmentation_model, 'avg_latency', 0) if segmentation_model else 0
    }
    
    if qdrant_manager and qdrant_manager.client:
        try:
            info = qdrant_manager.get_collection_info()
            # Handle different return types from qdrant-client versions
            if hasattr(info, 'points_count'):
                stats["qdrant_points"] = info.points_count
            else:
                stats["qdrant_points"] = info.get('points_count', 0)
        except:
            pass
    
    if db_manager:
        try:
            if isinstance(db_manager, PostgreSQLManager):
                count = await db_manager.get_total_predictions()
            else:
                count = db_manager.get_total_predictions()
            stats["total_predictions"] = count
        except:
            pass
    
    return stats


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)