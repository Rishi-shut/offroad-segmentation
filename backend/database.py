import os
import numpy as np
from typing import Optional, List, Dict, Any
from datetime import datetime


class QdrantManager:
    def __init__(self, url: str = None, api_key: str = None):
        self.client = None
        self.collection_name = "segmentation_memory"
        self.embedding_dim = 768
        
        if url:
            try:
                from qdrant_client import QdrantClient
                from qdrant_client.models import Distance, VectorParams
                
                self.client = QdrantClient(url=url, api_key=api_key)
                
                collections = self.client.get_collections().collections
                collection_names = [c.name for c in collections]
                
                if self.collection_name not in collection_names:
                    self.client.create_collection(
                        collection_name=self.collection_name,
                        vectors_config=VectorParams(
                            size=self.embedding_dim,
                            distance=Distance.COSINE
                        )
                    )
                print(f"Connected to Qdrant at {url}")
            except Exception as e:
                print(f"Qdrant connection error: {e}")
                self.client = None
        else:
            print("Qdrant URL not provided, running without vector DB")
    
    def insert_embedding(self, vector: np.ndarray, payload: Dict[str, Any]) -> str:
        if self.client is None:
            return "dummy_id"
        
        vector = vector.astype(np.float32)
        if vector.shape[-1] != self.embedding_dim:
            vector = np.resize(vector, self.embedding_dim)
        
        from qdrant_client.models import PointStruct
        
        point_id = payload.get('image_id', f"img_{np.random.randint(0, 999999)}")
        
        point = PointStruct(
            id=point_id,
            vector=vector.tolist(),
            payload=payload
        )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[point]
        )
        
        return point_id
    
    def search_similar(self, query_vector: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        if self.client is None:
            return []
        
        query_vector = query_vector.astype(np.float32)
        if query_vector.shape[-1] != self.embedding_dim:
            query_vector = np.resize(query_vector, self.embedding_dim)
        
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector.tolist(),
            limit=top_k,
            with_payload=True,
            with_vectors=False
        )
        
        return [
            {
                'id': result.id,
                'score': result.score,
                'payload': result.payload
            }
            for result in results
        ]
    
    def get_all_points(self, limit: int = 1000) -> List[Dict[str, Any]]:
        if self.client is None:
            return []
        
        try:
            results = self.client.scroll(
                collection_name=self.collection_name,
                limit=limit,
                with_payload=True,
                with_vectors=True
            )[0]
            
            return [
                {
                    'id': result.id,
                    'vector': result.vector,
                    'payload': result.payload
                }
                for result in results
            ]
        except:
            return []
    
    def get_collection_info(self):
        if self.client is None:
            return {'points_count': 0}
        
        try:
            return self.client.get_collection(self.collection_name)
        except:
            return {'points_count': 0}


class PostgreSQLManager:
    def __init__(self, database_url: str):
        self.pool = None
        self.url = database_url
        
        if database_url:
            try:
                import asyncpg
                import asyncio
                
                self.pool = asyncio.get_event_loop().run_until_complete(
                    asyncpg.create_pool(dsn=database_url, min_size=1, max_size=5)
                )
                print(f"Connected to PostgreSQL")
            except Exception as e:
                print(f"PostgreSQL connection error: {e}")
                self.pool = None
    
    async def create_tables(self):
        if self.pool is None:
            return
        
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    image_name VARCHAR(255) NOT NULL,
                    predicted_classes JSONB,
                    iou_score FLOAT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                )
            """)
            
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_predictions_user_id 
                ON predictions(user_id)
            """)
    
    async def save_prediction(
        self,
        user_id: str,
        image_name: str,
        predicted_classes: List[int],
        iou_score: float = None
    ):
        if self.pool is None:
            return
        
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO predictions (user_id, image_name, predicted_classes, iou_score)
                VALUES ($1, $2, $3, $4)
                """,
                user_id,
                image_name,
                predicted_classes,
                iou_score
            )
    
    async def get_user_predictions(
        self,
        user_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        if self.pool is None:
            return []
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, user_id, image_name, predicted_classes, iou_score, created_at
                FROM predictions
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                user_id,
                limit
            )
            
            return [
                {
                    'id': row['id'],
                    'user_id': row['user_id'],
                    'image_name': row['image_name'],
                    'predicted_classes': row['predicted_classes'],
                    'iou_score': row['iou_score'],
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None
                }
                for row in rows
            ]
    
    async def get_total_predictions(self) -> int:
        if self.pool is None:
            return 0
        
        async with self.pool.acquire() as conn:
            count = await conn.fetchval("SELECT COUNT(*) FROM predictions")
            return count
    
    async def close(self):
        if self.pool:
            await self.pool.close()