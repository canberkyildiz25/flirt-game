import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore } from '../store/gameStore';
import { RootStackParamList } from '../types';
import Portrait from '../components/Portrait';
import { Button, HeartMeter, STAGE_LABELS as LABELS } from '../components/ui';
import { color, font, radius, space, type } from '../theme';

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
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Sohbetlerim</Text>
        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Henüz kimseye yazmadın. Utangaçlık sana yakışmıyor.</Text>
            <Button label="Kartlara bak" icon="cards" compact style={{ alignSelf: 'flex-start' }} onPress={() => navigation.navigate('Characters')} />
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
                    <View style={styles.metaRow}>
                      <Text style={styles.stage}>{LABELS[character.stage]}</Text>
                      <HeartMeter value={character.affection} size={12} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.ink },
  inner: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingTop: 56 },
  title: { ...type.title, paddingHorizontal: space.xl, marginBottom: space.lg },
  list: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.ink2,
    borderWidth: 1,
    borderColor: color.line,
    marginBottom: space.sm,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: color.cream },
  rowText: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { fontFamily: font.displayMedium, fontSize: 15, color: color.cream },
  time: { fontFamily: font.body, fontSize: 12, color: color.creamFaint },
  preview: { fontFamily: font.body, fontSize: 14, color: color.creamDim, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 6 },
  stage: { fontFamily: font.bold, fontSize: 12, color: color.butter },
  empty: { paddingHorizontal: space.xl, paddingTop: space.xl, gap: space.lg },
  emptyText: { ...type.body },
});
