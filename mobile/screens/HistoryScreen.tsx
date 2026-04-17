import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native-stack';

import apiService from '../services/api';

type HistoryItem = {
  id: number;
  imageName: string;
  predictedClasses: number[];
  iouScore: number | null;
  createdAt: string;
};

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await apiService.getUserHistory();
        setHistory(data);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.card}>
      <Text style={styles.imageName}>{item.imageName}</Text>
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <View style={styles.classesContainer}>
        {item.predictedClasses.slice(0, 5).map((cls) => (
          <View key={cls} style={styles.classBadge}>
            <Text style={styles.classText}>{cls}</Text>
          </View>
        ))}
        {item.predictedClasses.length > 5 && (
          <Text style={styles.moreText}>+{item.predictedClasses.length - 5}</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Predictions</Text>
        <Text style={styles.count}>{history.length} total</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No predictions yet</Text>
          <Text style={styles.emptySubtext}>
            Start by uploading an image from the home screen
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  count: {
    fontSize: 14,
    color: '#666',
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
  imageName: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
  },
  date: {
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
  moreText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
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
  },
});