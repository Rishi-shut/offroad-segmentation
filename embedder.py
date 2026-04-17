import torch
import torch.nn as nn
from transformers import SegformerModel, SegformerConfig
import numpy as np
from typing import Optional


class Embedder(nn.Module):
    def __init__(self, model_name="nvidia/segformer-b2-finetuned-ade-512-512", embedding_dim=768):
        super().__init__()
        self.model_name = model_name
        self.embedding_dim = embedding_dim
        
        self.segformer = SegformerModel.from_pretrained(model_name)
        
        self.encoder = self.segformer.encoder
        
        with torch.no_grad():
            dummy_input = torch.zeros(1, 3, 512, 512)
            dummy_output = self.encoder(dummy_input, output_hidden_states=True)
            self.feature_dim = dummy_output.hidden_states[-1].shape[1]
        
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        
        if self.feature_dim != embedding_dim:
            self.projection = nn.Linear(self.feature_dim, embedding_dim)
        else:
            self.projection = None
    
    def forward(self, x):
        with torch.no_grad():
            outputs = self.encoder(x, output_hidden_states=True)
            
            last_hidden_state = outputs.hidden_states[-1]
            
            pooled = self.pool(last_hidden_state)
            embedding = pooled.view(pooled.size(0), -1)
        
        if self.projection is not None:
            embedding = self.projection(embedding)
        
        embedding = nn.functional.normalize(embedding, p=2, dim=1)
        
        return embedding
    
    def extract_embedding(self, image_tensor):
        self.eval()
        with torch.no_grad():
            if image_tensor.dim() == 3:
                image_tensor = image_tensor.unsqueeze(0)
            
            if image_tensor.device != next(self.parameters()).device:
                image_tensor = image_tensor.to(next(self.parameters()).device)
            
            embedding = self.forward(image_tensor)
        
        return embedding.cpu().numpy().squeeze()


class EmbedderResNet(nn.Module):
    def __init__(self, embedding_dim=512):
        super().__init__()
        from torchvision.models import resnet50, ResNet50_Weights
        
        self.embedding_dim = embedding_dim
        
        weights = ResNet50_Weights.DEFAULT
        self.backbone = resnet50(weights=weights)
        
        self.backbone.fc = nn.Identity()
        
        if embedding_dim != 2048:
            self.projection = nn.Linear(2048, embedding_dim)
        else:
            self.projection = None
    
    def forward(self, x):
        embedding = self.backbone(x)
        
        if self.projection is not None:
            embedding = self.projection(embedding)
        
        embedding = nn.functional.normalize(embedding, p=2, dim=1)
        
        return embedding
    
    def extract_embedding(self, image_tensor):
        self.eval()
        with torch.no_grad():
            if image_tensor.dim() == 3:
                image_tensor = image_tensor.unsqueeze(0)
            
            if image_tensor.device != next(self.parameters()).device:
                image_tensor = image_tensor.to(next(self.parameters()).device)
            
            embedding = self.forward(image_tensor)
        
        return embedding.cpu().numpy().squeeze()


def create_embedder(encoder_type='segformer', embedding_dim=768):
    if encoder_type == 'segformer':
        return Embedder(embedding_dim=embedding_dim)
    elif encoder_type == 'resnet':
        return EmbedderResNet(embedding_dim=embedding_dim)
    else:
        raise ValueError(f"Unknown encoder type: {encoder_type}")