import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { RootStackParamList } from '../App';
import apiService from '../services/api';

type HomeScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavProp>();
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    setLoading(true);
    try {
      const result = await apiService.predictFromPicker();
      navigation.navigate('Results', {
        imageUri: '',
        maskBase64: result.maskBase64,
        classes: result.classes,
      });
    } catch (error: any) {
      if (error.message !== 'Image selection canceled') {
        Alert.alert('Error', error.message || 'Failed to process image');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    setLoading(true);
    try {
      const result = await apiService.predictFromCamera();
      navigation.navigate('Results', {
        imageUri: '',
        maskBase64: result.maskBase64,
        classes: result.classes,
      });
    } catch (error: any) {
      if (error.message !== 'Camera capture canceled') {
        Alert.alert('Error', error.message || 'Failed to capture image');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  const checkApiConnection = async () => {
    const isHealthy = await apiService.checkHealth();
    if (!isHealthy) {
      Alert.alert(
        'API Offline',
        'The prediction service is currently offline. Please try again later.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Off-Road Segmentation</Text>
        <Text style={styles.subtitle}>AI-powered terrain analysis</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>10 Terrain Classes</Text>
          <Text style={styles.infoText}>
            Road, Vegetation, Gravel, Sand, Rock, Obstacle, Trail, Water, Other, Background
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#00d4ff" />
          ) : (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={handlePickImage}
              >
                <Text style={styles.buttonText}>📷 Pick from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleTakePhoto}
              >
                <Text style={styles.buttonText}>📸 Take Photo</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={handleViewHistory}
        >
          <Text style={styles.historyButtonText}>📊 View History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkButton}
          onPress={checkApiConnection}
        >
          <Text style={styles.checkButtonText}>Check API Status</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by SegFormer • Qdrant Vector Search
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#aaa',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#00d4ff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#2a2a4e',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyButton: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  historyButtonText: {
    fontSize: 16,
    color: '#00d4ff',
  },
  checkButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  checkButtonText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#444',
  },
});