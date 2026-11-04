import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { RootStackParamList } from '../types';
import { navigationRef } from './ref';

type Destination = 'Home' | 'Characters' | 'Conversations';

const ITEMS: { route: Destination; label: string }[] = [
  { route: 'Home', label: 'Ana sayfa' },
  { route: 'Characters', label: 'Karakterler' },
  { route: 'Conversations', label: 'Sohbetlerim' },
];

// Geniş ekranda soldaki sabit menü. Profil ve sohbet, açıldıkları listenin altında sayılır.
const PARENT: Partial<Record<keyof RootStackParamList, Destination>> = {
  CharacterProfile: 'Characters',
  Chat: 'Conversations',
};

export default function Sidebar({ current }: { current?: keyof RootStackParamList }) {
  const coins = useGameStore((s) => s.coins);
  const chats = useGameStore((s) => Object.keys(s.conversations).length);
  const active = current ? PARENT[current] ?? current : 'Home';

  return (
    <View style={styles.root}>
      <Text style={styles.logo}>FlirtGame</Text>
      <View style={styles.nav}>
        {ITEMS.map((item) => {
          const isActive = item.route === active;
          return (
            <TouchableOpacity
              key={item.route}
              accessibilityRole="link"
              accessibilityState={{ selected: isActive }}
              onPress={() => navigationRef.isReady() && navigationRef.navigate(item.route)}
              style={[styles.item, isActive && styles.itemActive]}
            >
              <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{item.label}</Text>
              {item.route === 'Conversations' && chats > 0 && <Text style={styles.count}>{chats}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Text style={styles.coins}>🪙 {coins}</Text>
        <Text style={styles.note}>Karakterler kurgusaldır, sohbetlere yapay zekâ cevap verir.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 232,
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0d0019',
  },
  logo: { color: '#fff', fontSize: 24, fontWeight: '800', paddingHorizontal: 12, marginBottom: 28 },
  nav: { gap: 4 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 10,
  },
  itemActive: { backgroundColor: 'rgba(233,30,140,0.14)' },
  itemText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  itemTextActive: { color: '#fff', fontWeight: '700' },
  count: { color: '#E91E8C', fontSize: 13, fontWeight: '700' },
  footer: { marginTop: 'auto', paddingHorizontal: 12, gap: 10 },
  coins: { color: '#FFD700', fontSize: 15, fontWeight: '700' },
  note: { color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 17 },
});
