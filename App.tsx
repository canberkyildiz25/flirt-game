import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import AgeGateScreen from './src/screens/AgeGateScreen';
import { useGameStore } from './src/store/gameStore';
import Sidebar from './src/navigation/Sidebar';
import { useLayout } from './src/navigation/layout';
import { RootStackParamList } from './src/types';

export default function App() {
  const isAdultConfirmed = useGameStore((s) => s.isAdultConfirmed);
  const { isWide } = useLayout();
  const [route, setRoute] = useState<keyof RootStackParamList>();

  return (
    <>
      <StatusBar style="light" />
      {/* Geniş web ekranında solda menü, dar ekranda ortada telefon genişliğinde tek sütun. */}
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0a0015' }}>
        {isAdultConfirmed && isWide && <Sidebar current={route} />}
        <View style={{ flex: 1, width: '100%', maxWidth: isWide ? undefined : 520, alignSelf: 'center', height: '100%' }}>
          {isAdultConfirmed ? <AppNavigator onRouteChange={setRoute} /> : <AgeGateScreen />}
        </View>
      </View>
    </>
  );
}
