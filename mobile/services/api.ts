import axios, { AxiosInstance } from 'axios';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;
  private userId: string;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 60000,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    this.userId = `user_${Date.now()}`;
  }

  getUserId(): string {
    return this.userId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  async predictFromUri(uri: string): Promise<{
    imageId: string;
    maskBase64: string;
    classes: number[];
  }> {
    const formData = new FormData();
    
    const filename = uri.split('/').pop() || 'image.jpg';
    const fileType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    formData.append('image', {
      uri,
      name: filename,
      type: fileType,
    } as any);
    
    formData.append('user_id', this.userId);
    
    const response = await this.client.post('/predict/', formData);
    return response.data;
  }

  async predictFromPicker(): Promise<{
    imageId: string;
    maskBase64: string;
    classes: number[];
  }> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (result.canceled) {
      throw new Error('Image selection canceled');
    }
    
    return this.predictFromUri(result.assets[0].uri);
  }

  async predictFromCamera(): Promise<{
    imageId: string;
    maskBase64: string;
    classes: number[];
  }> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permission.granted) {
      throw new Error('Camera permission not granted');
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (result.canceled) {
      throw new Error('Camera capture canceled');
    }
    
    return this.predictFromUri(result.assets[0].uri);
  }

  async getSimilarScenes(imageId: string, topK: number = 5): Promise<Array<{
    imageId: string;
    score: number;
    predictedClasses: number[];
    iouScore: number | null;
  }>> {
    const response = await this.client.get(`/similar/${imageId}?top_k=${topK}`);
    return response.data.map((item: any) => ({
      imageId: item.image_id,
      score: item.score,
      predictedClasses: item.predicted_classes,
      iouScore: item.iou_score,
    }));
  }

  async getUserHistory(limit: number = 20): Promise<Array<{
    id: number;
    imageName: string;
    predictedClasses: number[];
    iouScore: number | null;
    createdAt: string;
  }>> {
    const response = await this.client.get(`/history/${this.userId}?limit=${limit}`);
    return response.data;
  }

  async getStats(): Promise<{
    totalPredictions: number;
    qdrantPoints: number;
  }> {
    const response = await this.client.get('/stats');
    return response.data;
  }

  asyncSaveTempImage(base64: string): string {
    const path = `${FileSystem.cacheDirectory}temp_mask.png`;
    FileSystem.writeAsStringAsync(path, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return path;
  }
}

export const apiService = new ApiService();
export default apiService;