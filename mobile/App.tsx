import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import SimilarScreen from './screens/SimilarScreen';

export type RootStackParamList = {
  Home: undefined;
  Results: { imageUri: string; maskBase64: string; classes: number[] };
  History: undefined;
  Similar: { imageId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const CLASS_NAMES = [
  'Background', 'Road', 'Vegetation', 'Gravel', 'Sand', 
  'Rock', 'Obstacle', 'Trail', 'Water', 'Other'
];

const CLASS_COLORS = [
  '#000000', '#800000', '#008000', '#808000', '#000080', 
  '#800080', '#008080', '#808080', '#400000', '#C00000'
];

export { CLASS_NAMES, CLASS_COLORS };

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#16213e' },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Off-Road Segmentation' }}
          />
          <Stack.Screen 
            name="Results" 
            component={ResultsScreen}
            options={{ title: 'Results' }}
          />
          <Stack.Screen 
            name="History" 
            component={HistoryScreen}
            options={{ title: 'History' }}
          />
          <Stack.Screen 
            name="Similar" 
            component={SimilarScreen}
            options={{ title: 'Similar Scenes' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}