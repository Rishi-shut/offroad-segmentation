import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { decode } from 'base64-js';
import * as FileSystem from 'expo-file-system';

import { RootStackParamList, CLASS_NAMES, CLASS_COLORS } from '../App';

type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;
type ResultsScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;

export default function ResultsScreen() {
  const route = useRoute<ResultsScreenRouteProp>();
  const navigation = useNavigation<ResultsScreenNavProp>();
  const { maskBase64, classes } = route.params;
  
  const [maskUri, setMaskUri] = useState<string>('');

  useEffect(() => {
    const saveMask = async () => {
      if (maskBase64) {
        const path = `${FileSystem.cacheDirectory}mask_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(path, maskBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setMaskUri(`file://${path}`);
      }
    };
    saveMask();
  }, [maskBase64]);

  const handleFindSimilar = () => {
    navigation.navigate('Similar', { imageId: `img_${Date.now()}` });
  };

  const handleNewPrediction = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Segmentation Results</Text>
      </View>

      <View style={styles.imageContainer}>
        {maskUri ? (
          <>
            <Image source={{ uri: maskUri }} style={styles.maskImage} />
          </>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Processing...</Text>
          </View>
        )}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Detected Classes</Text>
        {classes.map((classId) => (
          <View key={classId} style={styles.legendItem}>
            <View 
              style={[
                styles.colorBox, 
                { backgroundColor: CLASS_COLORS[classId] || '#808080' }
              ]} 
            />
            <Text style={styles.legendText}>
              {CLASS_NAMES[classId] || `Class ${classId}`}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{classes.length}</Text>
          <Text style={styles.statLabel}>Classes Found</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleFindSimilar}>
          <Text style={styles.buttonText}>🔍 Find Similar Scenes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]} 
          onPress={handleNewPrediction}
        >
          <Text style={styles.buttonText}>➕ New Prediction</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    padding: 10,
  },
  maskImage: {
    width: 300,
    height: 300,
    borderRadius: 12,
  },
  placeholder: {
    width: 300,
    height: 300,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
  },
  legend: {
    backgroundColor: '#1a1a2e',
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#ccc',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  button: {
    backgroundColor: '#00d4ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#2a2a4e',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});