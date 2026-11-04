import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore } from '../store/gameStore';
import { RootStackParamList } from '../types';
import Portrait from '../components/Portrait';

type Nav = StackNavigationProp<RootStackParamList, 'Conversations'>;

const STAGE_LABELS: Record<string, string> = {
  stranger: 'Yabancı',
  acquaintance: 'Tanıdık',
  friend: 'Arkadaş',
  crush: 'Crush',
  romantic: 'Romantik',
  lover: 'Sevgili',
};

function timeAgo(at: number): string {
  const minutes = Math.floor((Date.now() - at) / 60_000);
  if (minutes < 1) return 'şimdi';
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  return `${Math.floor(hours / 24)} gün`;
}

export default function ConversationsScreen() {
  const navigation = useNavigation<Nav>();
  const characters = useGameStore((s) => s.characters);
  const conversations = useGameStore((s) => s.conversations);

  const rows = characters
    .filter((c) => conversations[c.id]?.messages.length)
    .map((c) => ({ character: c, conversation: conversations[c.id] }))
    .sort((a, b) => b.conversation.updatedAt - a.conversation.updatedAt);

  return (
    <LinearGradient colors={['#0a0015', '#1a0030']} style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Sohbetlerim</Text>
        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Henüz kimseyle konuşmadın.</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Characters')}
            >
              <Text style={styles.emptyButtonText}>Karakterlere bak</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row) => row.character.id}
            contentContainerStyle={styles.list}
            renderItem={({ item: { character, conversation } }) => {
              const last = conversation.messages[conversation.messages.length - 1];
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.row}
                  onPress={() => navigation.navigate('Chat', { characterId: character.id })}
                >
                  <Portrait character={character} style={styles.avatar} />
                  <View style={styles.rowText}>
                    <View style={styles.rowTop}>
                      <Text style={styles.name}>{character.name}</Text>
                      <Text style={styles.time}>{timeAgo(conversation.updatedAt)}</Text>
                    </View>
                    <Text style={styles.preview} numberOfLines={1}>
                      {last.isPlayer ? 'Sen: ' : ''}
                      {last.text}
                    </Text>
                    <Text style={[styles.stage, { color: character.color }]}>
                      {STAGE_LABELS[character.stage]} · {character.affection}/100
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingTop: 60 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', paddingHorizontal: 24, marginBottom: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 8,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  rowText: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  time: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  preview: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2 },
  stage: { fontSize: 12, marginTop: 4 },
  empty: { paddingHorizontal: 24, paddingTop: 24 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 16 },
  emptyButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#E91E8C',
    borderRadius: 12,
    paddingHorizontal: 18,
    minHeight: 44,
    justifyContent: 'center',
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
