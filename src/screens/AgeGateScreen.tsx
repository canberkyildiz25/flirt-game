import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default function AgeGateScreen() {
  const confirmAdult = useGameStore((s) => s.confirmAdult);
  const [declined, setDeclined] = useState(false);

  return (
    <View style={styles.root}>
      <Text style={styles.mark}>18+</Text>
      {declined ? (
        <Text style={styles.body}>Bu oyun yetişkinlere göre. Başka zaman görüşürüz.</Text>
      ) : (
        <>
          <Text style={styles.title}>Bu oyun yetişkinler için.</Text>
          <Text style={styles.body}>
            Karakterlerin hepsi kurgusal ve 18 yaşından büyük. Serbest sohbette sana yapay zekâ cevap verir.
          </Text>
          <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={confirmAdult}>
            <Text style={styles.primaryText}>18 yaşından büyüğüm</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={() => setDeclined(true)}>
            <Text style={styles.secondaryText}>Değilim</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0015', padding: 28, justifyContent: 'center' },
  mark: { color: '#E91E8C', fontSize: 64, fontWeight: '800', marginBottom: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 12 },
  body: { color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 24, marginBottom: 32 },
  primary: { backgroundColor: '#E91E8C', borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondary: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryText: { color: 'rgba(255,255,255,0.72)', fontSize: 16 },
});
