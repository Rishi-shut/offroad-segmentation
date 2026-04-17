import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native-stack';

import apiService from '../services/api';
import { RootStackParamList, CLASS_NAMES } from '../App';

type SimilarScreenRouteProp = RouteProp<RootStackParamList, 'Similar'>;

type SimilarItem = {
  imageId: string;
  score: number;
  predictedClasses: number[];
  iouScore: number | null;
};

export default function SimilarScreen() {
  const route = useRoute<SimilarScreenRouteProp>();
  const navigation = useNavigation();
  const { imageId } = route.params;
  
  const [similar, setSimilar] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findSimilar = async () => {
      try {
        const data = await apiService.getSimilarScenes(imageId, 10);
        setSimilar(data);
      } catch (error) {
        console.error('Failed to find similar scenes:', error);
      } finally {
        setLoading(false);
      }
    };
    findSimilar();
  }, [imageId]);

  const renderItem = ({ item, index }: { item: SimilarItem; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.rank}>#{index + 1}</Text>
        <Text style={styles.imageId}>{item.imageId}</Text>
        <Text style={styles.score}>{(item.score * 100).toFixed(1)}% match</Text>
      </View>
      
      {item.iouScore !== null && (
        <Text style={styles.iou}>IoU: {item.iouScore.toFixed(3)}</Text>
      )}
      
      <View style={styles.classesContainer}>
        {item.predictedClasses.slice(0, 5).map((cls) => (
          <View key={cls} style={styles.classBadge}>
            <Text style={styles.classText}>{CLASS_NAMES[cls] || cls}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Searching for similar scenes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Similar Scenes</Text>
        <Text style={styles.subtitle}>Using Qdrant Vector Search</Text>
      </View>

      {similar.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No similar scenes found</Text>
          <Text style={styles.emptySubtext}>
            The vector database may be empty or the image wasn't stored
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.info}>
            Found {similar.length} similar scenes using semantic embeddings
          </Text>
          <FlatList
            data={similar}
            renderItem={renderItem}
            keyExtractor={(item) => item.imageId}
            contentContainerStyle={styles.list}
          />
        </>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back to Results</Text>
      </TouchableOpacity>
    </View>
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
  subtitle: {
    fontSize: 14,
    color: '#00d4ff',
    marginTop: 5,
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginRight: 10,
  },
  imageId: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  iou: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  classesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  classBadge: {
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  classText: {
    fontSize: 12,
    color: '#00d4ff',
  },
  loadingText: {
    color: '#666',
    marginTop: 15,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  backButton: {
    padding: 20,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#00d4ff',
  },
});