import os
import numpy as np
import torch
from torch.utils.data import Dataset
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2


ORIGINAL_LABELS = [100, 200, 300, 500, 550, 600, 700, 800, 7100, 10000]
REMAPPED_LABELS = list(range(10))


class OffRoadDataset(Dataset):
    def __init__(self, images_dir, masks_dir, image_size=512, train=True, augment=True):
        self.images_dir = images_dir
        self.masks_dir = masks_dir
        self.image_size = image_size
        self.train = train
        self.augment = augment
        
        self.image_files = sorted([f for f in os.listdir(images_dir) 
                                  if f.endswith(('.png', '.jpg', '.jpeg'))])
        
        self.label_mapping = {orig: remap for orig, remap in zip(ORIGINAL_LABELS, REMAPPED_LABELS)}
        
        if augment:
            self.transform = self._get_train_transform()
        else:
            self.transform = self._get_val_transform()
    
    def _get_train_transform(self):
        return A.Compose([
            A.Resize(self.image_size, self.image_size),
            A.HorizontalFlip(p=0.5),
            A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
            A.GaussianBlur(blur_limit=3, p=0.2),
            A.Rotate(limit=15, p=0.5),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])
    
    def _get_val_transform(self):
        return A.Compose([
            A.Resize(self.image_size, self.image_size),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2()
        ])
    
    def _remap_label(self, mask):
        remapped = np.zeros_like(mask, dtype=np.int64)
        for orig, remap in self.label_mapping.items():
            remapped[mask == orig] = remap
        return remapped
    
    def __len__(self):
        return len(self.image_files)
    
    def __getitem__(self, idx):
        img_name = self.image_files[idx]
        img_path = os.path.join(self.images_dir, img_name)
        
        base_name = os.path.splitext(img_name)[0]
        if os.path.exists(os.path.join(self.masks_dir, base_name + '.png')):
            mask_path = os.path.join(self.masks_dir, base_name + '.png')
        else:
            mask_path = os.path.join(self.masks_dir, base_name + '.jpg')
            if not os.path.exists(mask_path):
                mask_path = os.path.join(self.masks_dir, base_name)
        
        image = np.array(Image.open(img_path).convert('RGB'))
        
        try:
            mask = np.array(Image.open(mask_path).convert('L'))
            mask = self._remap_label(mask)
        except Exception:
            mask = np.zeros((self.image_size, self.image_size), dtype=np.int64)
        
        transformed = self.transform(image=image, mask=mask)
        image = transformed['image']
        mask = transformed['mask']
        
        return image, mask, img_name


def get_dataloaders(train_images, train_masks, val_images, val_masks, 
                   batch_size=4, image_size=512, num_workers=2):
    train_dataset = OffRoadDataset(train_images, train_masks, image_size, train=True, augment=True)
    val_dataset = OffRoadDataset(val_images, val_masks, image_size, train=False, augment=False)
    
    train_loader = torch.utils.data.DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available(),
        drop_last=True
    )
    
    val_loader = torch.utils.data.DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available()
    )
    
    return train_loader, val_loader