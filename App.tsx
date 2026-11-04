import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import AgeGateScreen from './src/screens/AgeGateScreen';
import { useGameStore } from './src/store/gameStore';

export default function App() {
  const isAdultConfirmed = useGameStore((s) => s.isAdultConfirmed);

  return (
    <>
      <StatusBar style="light" />
      {/* Web'de uygulama ortada sabit genişlikte durur. */}
      <View style={{ flex: 1, backgroundColor: '#0a0015' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          {isAdultConfirmed ? <AppNavigator /> : <AgeGateScreen />}
        </View>
      </View>
    </>
  );
}
