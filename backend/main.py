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

from model_inference import SegmentationModel
from database import QdrantManager, PostgreSQLManager

app = FastAPI(title="Off-Road Segmentation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

segmentation_model = None
qdrant_manager = None
postgres_manager = None


@app.on_event("startup")
async def startup_event():
    global segmentation_model, qdrant_manager, postgres_manager
    
    model_path = os.environ.get("MODEL_PATH", "best_model.pth")
    
    try:
        segmentation_model = SegmentationModel(model_path)
        print(f"Model loaded from {model_path}")
    except Exception as e:
        print(f"Warning: Could not load model: {e}")
        segmentation_model = None
    
    qdrant_url = os.environ.get("QDRANT_URL")
    qdrant_api_key = os.environ.get("QDRANT_API_KEY")
    
    if qdrant_url:
        qdrant_manager = QdrantManager(url=qdrant_url, api_key=qdrant_api_key)
    else:
        qdrant_manager = QdrantManager()
    
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        postgres_manager = PostgreSQLManager(db_url)
        await postgres_manager.create_tables()


@app.on_event("shutdown")
async def shutdown_event():
    if postgres_manager:
        await postgres_manager.close()


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


@app.get("/")
async def root():
    return {"message": "Off-Road Segmentation API", "status": "running"}


@app.get("/health")
async def health_check():
    model_loaded = segmentation_model is not None
    return {
        "status": "healthy",
        "model_loaded": model_loaded,
        "qdrant_connected": qdrant_manager is not None,
        "postgres_connected": postgres_manager is not None
    }


@app.post("/predict/", response_model=PredictionResponse)
async def predict(image: UploadFile = File(...), user_id: Optional[str] = None):
    if segmentation_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')
        
        mask, classes = segmentation_model.predict(img)
        
        mask_array = np.array(mask)
        mask_pil = Image.fromarray(mask_array.astype(np.uint8))
        
        buffer = io.BytesIO()
        mask_pil.save(buffer, format="PNG")
        mask_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        unique_classes = sorted(np.unique(mask_array).tolist())
        
        if qdrant_manager and segmentation_model.embedder:
            try:
                embedding = segmentation_model.extract_embedding(img)
                payload = {
                    "image_id": image.filename,
                    "predicted_classes": unique_classes,
                    "user_id": user_id,
                    "iou_score": None
                }
                qdrant_manager.insert_embedding(embedding, payload)
            except Exception as e:
                print(f"Qdrant insertion error: {e}")
        
        if postgres_manager and user_id:
            try:
                await postgres_manager.save_prediction(
                    user_id=user_id,
                    image_name=image.filename,
                    predicted_classes=unique_classes
                )
            except Exception as e:
                print(f"PostgreSQL save error: {e}")
        
        return PredictionResponse(
            image_id=image.filename,
            mask_base64=mask_base64,
            classes=unique_classes
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch/", response_model=List[PredictionResponse])
async def predict_batch(images: List[UploadFile] = File(...)):
    if segmentation_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    results = []
    
    for image in images:
        try:
            contents = await image.read()
            img = Image.open(io.BytesIO(contents)).convert('RGB')
            
            mask, classes = segmentation_model.predict(img)
            
            mask_array = np.array(mask)
            mask_pil = Image.fromarray(mask_array.astype(np.uint8))
            
            buffer = io.BytesIO()
            mask_pil.save(buffer, format="PNG")
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


@app.get("/similar/{image_id}", response_model=List[SimilarResponse])
async def get_similar_scenes(image_id: str, top_k: int = 5):
    if qdrant_manager is None:
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


@app.get("/history/{user_id}", response_model=List[UserPrediction])
async def get_user_history(user_id: str, limit: int = 20):
    if postgres_manager is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        predictions = await postgres_manager.get_user_predictions(user_id, limit=limit)
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats/")
async def get_stats():
    stats = {"total_predictions": 0, "qdrant_points": 0}
    
    if qdrant_manager:
        try:
            info = qdrant_manager.get_collection_info()
            stats["qdrant_points"] = info.get('points_count', 0)
        except:
            pass
    
    if postgres_manager:
        try:
            count = await postgres_manager.get_total_predictions()
            stats["total_predictions"] = count
        except:
            pass
    
    return stats


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)