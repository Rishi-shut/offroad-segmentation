from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import numpy as np
from typing import List, Dict, Any, Optional
import os


class QdrantManager:
    def __init__(self, host="localhost", port=6333, collection_name="segmentation_memory", 
                 embedding_dim=768, force_recreate=False):
        self.host = host
        self.port = port
        self.collection_name = collection_name
        self.embedding_dim = embedding_dim
        
        try:
            self.client = QdrantClient(host=host, port=port)
        except Exception as e:
            print(f"Warning: Could not connect to Qdrant at {host}:{port}")
            print("Falling back to in-memory mode")
            self.client = QdrantClient(":memory:")
        
        self._initialize_collection(force_recreate)
    
    def _initialize_collection(self, force_recreate):
        collections = self.client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if self.collection_name in collection_names:
            if force_recreate:
                self.client.delete_collection(self.collection_name)
                self._create_collection()
            else:
                print(f"Collection '{self.collection_name}' already exists")
        else:
            self._create_collection()
    
    def _create_collection(self):
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=self.embedding_dim,
                distance=Distance.COSINE
            )
        )
        print(f"Created collection '{self.collection_name}' with embedding dim {self.embedding_dim}")
    
    def insert_embedding(self, vector: np.ndarray, payload: Dict[str, Any]) -> str:
        point_id = payload.get('image_id', f"img_{np.random.randint(0, 999999)}")
        
        vector = vector.astype(np.float32)
        if vector.shape[-1] != self.embedding_dim:
            if vector.ndim == 1:
                vector = np.resize(vector, self.embedding_dim)
            else:
                raise ValueError(f"Vector dimension {vector.shape[-1]} does not match embedding dim {self.embedding_dim}")
        
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
    
    def insert_batch(self, vectors: List[np.ndarray], payloads: List[Dict[str, Any]]) -> List[str]:
        points = []
        ids = []
        
        for vector, payload in zip(vectors, payloads):
            point_id = payload.get('image_id', f"img_{np.random.randint(0, 999999)}")
            ids.append(point_id)
            
            vector = vector.astype(np.float32)
            if vector.shape[-1] != self.embedding_dim:
                vector = np.resize(vector, self.embedding_dim)
            
            point = PointStruct(
                id=point_id,
                vector=vector.tolist(),
                payload=payload
            )
            points.append(point)
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        
        return ids
    
    def search_similar(self, query_vector: np.ndarray, top_k: int = 5, 
                      score_threshold: Optional[float] = None) -> List[Dict[str, Any]]:
        query_vector = query_vector.astype(np.float32)
        if query_vector.shape[-1] != self.embedding_dim:
            query_vector = np.resize(query_vector, self.embedding_dim)
        
        search_params = {}
        if score_threshold is not None:
            search_params['score_threshold'] = score_threshold
        
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector.tolist(),
            limit=top_k,
            with_payload=True,
            with_vectors=False,
            **search_params
        )
        
        return [
            {
                'id': result.id,
                'score': result.score,
                'payload': result.payload
            }
            for result in results
        ]
    
    def search_by_filter(self, filter_conditions: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        from qdrant_client.models import Filter, FieldCondition, Match
        
        must_conditions = []
        for key, value in filter_conditions.items():
            must_conditions.append(
                FieldCondition(key=key, match=Match(value=value))
            )
        
        filter_obj = Filter(must=must_conditions)
        
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=[0.0] * self.embedding_dim,
            query_filter=filter_obj,
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
        results = self.client.scroll(
            collection_name=self.collection_name,
            limit=limit,
            with_payload=True,
            with_vectors=False
        )[0]
        
        return [
            {
                'id': result.id,
                'payload': result.payload
            }
            for result in results
        ]
    
    def delete_collection(self):
        self.client.delete_collection(self.collection_name)
        print(f"Deleted collection '{self.collection_name}'")
    
    def get_collection_info(self):
        return self.client.get_collection(self.collection_name)


def create_qdrant_manager(host="localhost", port=6333, collection_name="segmentation_memory",
                       embedding_dim=768, force_recreate=False):
    return QdrantManager(host=host, port=port, collection_name=collection_name,
                         embedding_dim=embedding_dim, force_recreate=force_recreate)