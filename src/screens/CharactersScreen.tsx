import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore, UNLOCK_COST } from '../store/gameStore';
import { Character, RootStackParamList } from '../types';
import Portrait from '../components/Portrait';
import Icon from '../components/Icon';
import { Chip, CoinPill, HeartMeter, StageRibbon } from '../components/ui';
import { useLayout } from '../navigation/layout';
import { confirmAction, notify } from '../utils/confirm';
import { color, font, radius, space, type } from '../theme';

const GAP = 16;
const SIDE = 16;
const CREATE_TILE = '__create';

type Nav = StackNavigationProp<RootStackParamList, 'Characters'>;

type Filter = 'all' | 'met' | 'locked' | 'mine';
const FILTERS: { id: Filter; label: string; test: (c: Character) => boolean }[] = [
  { id: 'all', label: 'Tümü', test: () => true },
  { id: 'met', label: 'Tanıştıklarım', test: (c) => c.isUnlocked && !c.isCustom },
  { id: 'locked', label: 'Kilitli', test: (c) => !c.isUnlocked },
  { id: 'mine', label: 'Benim karakterlerim', test: (c) => !!c.isCustom },
];

function CreateTile({ width }: { width: number }) {
  const navigation = useNavigation<Nav>();
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, styles.createCard, { width, minHeight: width * 1.3 + 84 }, pressed && styles.pressed]}
      onPress={() => navigation.navigate('Create')}
    >
      <View style={styles.createIcon}>
        <Icon name="plus" size={28} color={color.ink} />
      </View>
      <Text style={styles.createTitle}>Kendi kartını yarat</Text>
      <Text style={styles.createBody}>Kişiliğini ve görünüşünü sen seç, portresi hazırlansın.</Text>
    </Pressable>
  );
}

// Koleksiyon kartı: krem çerçeve, köşede aşama şeridi, altta ad ve kalp ölçeği.
function CharacterCard({ character, width }: { character: Character; width: number }) {
  const navigation = useNavigation<Nav>();
  const coins = useGameStore((s) => s.coins);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const unlockCharacter = useGameStore((s) => s.unlockCharacter);

  function handleUnlock() {
    if (coins < UNLOCK_COST) {
      notify('Jetonun yetmiyor', `Bu kartı açmak için ${UNLOCK_COST} jeton gerekiyor, sende ${coins} var. Sohbet ettikçe jeton kazanırsın.`);
      return;
    }
    confirmAction('Yeni kart aç', `Bu kartı açmak için ${UNLOCK_COST} jeton harcansın mı?`, `${UNLOCK_COST} jeton harca`, () => {
      spendCoins(UNLOCK_COST);
      unlockCharacter(character.id);
    });
  }

  const open = () =>
    character.isUnlocked ? navigation.navigate('CharacterProfile', { characterId: character.id }) : handleUnlock();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={character.isUnlocked ? `${character.name}, ${character.age}` : 'Kilitli kart'}
      onPress={open}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={[styles.photo, { height: width * 1.3 }]}>
        {character.isUnlocked ? (
          <>
            <Portrait character={character} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['transparent', 'rgba(26,15,20,0.9)']} style={styles.shade} />
            <View style={styles.ribbon}>
              <StageRibbon stage={character.stage} tint={color.butter} />
            </View>
          </>
        ) : (
          <View style={styles.locked}>
            <Icon name="lock" size={30} color={color.creamFaint} />
            <View style={styles.lockPrice}>
              <Icon name="coin" size={16} />
              <Text style={styles.lockPriceText}>{UNLOCK_COST}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.name} numberOfLines={1}>
          {character.isUnlocked ? character.name : 'Gizli kart'}
        </Text>
        {character.isUnlocked ? (
          <View style={styles.metaRow}>
            <Text style={styles.age}>{character.age}</Text>
            <HeartMeter value={character.affection} size={13} />
          </View>
        ) : (
          <Text style={styles.age}>Açmak için dokun</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function CharactersScreen() {
  const characters = useGameStore((s) => s.characters);
  const coins = useGameStore((s) => s.coins);
  const unlockedCount = characters.filter((c) => c.isUnlocked).length;
  const { contentWidth, columns } = useLayout();
  const cardWidth = Math.floor((contentWidth - SIDE * 2 - GAP * (columns - 1)) / columns);
  const [filter, setFilter] = useState<Filter>('all');
  const visible = characters.filter(FILTERS.find((f) => f.id === filter)!.test);
  const tiles: (Character | typeof CREATE_TILE)[] = filter === 'locked' ? visible : [CREATE_TILE, ...visible];

  return (
    <View style={styles.container}>
      <FlatList
        data={tiles}
        keyExtractor={(item) => (item === CREATE_TILE ? item : item.id)}
        key={columns}
        numColumns={columns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={type.title}>Kartların</Text>
                <Text style={type.small}>{unlockedCount}/{characters.length} kart açık</Text>
              </View>
              <CoinPill amount={coins} />
            </View>
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <Chip key={f.id} role="tab" label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) =>
          item === CREATE_TILE ? <CreateTile width={cardWidth} /> : <CharacterCard character={item} width={cardWidth} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.ink },
  listContent: { paddingHorizontal: SIDE, paddingTop: 56, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.lg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.xl },
  row: { gap: GAP, marginBottom: GAP },
  card: {
    borderRadius: radius.lg,
    backgroundColor: color.ink2,
    borderWidth: 3,
    borderColor: color.cream,
    overflow: 'hidden',
  },
  pressed: { transform: [{ translateY: 2 }] },
  photo: { backgroundColor: color.ink3 },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%' },
  ribbon: { position: 'absolute', top: space.sm, left: space.sm },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  lockPrice: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, minHeight: 28, borderRadius: radius.pill, backgroundColor: color.ink,
  },
  lockPriceText: { fontFamily: font.bold, fontSize: 14, color: color.butter },
  cardBottom: { paddingHorizontal: space.md, paddingVertical: space.md, gap: 4 },
  name: { fontFamily: font.displayMedium, fontSize: 16, color: color.cream },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  age: { fontFamily: font.medium, fontSize: 13, color: color.creamFaint },
  createCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    borderStyle: 'dashed',
    borderColor: color.butter,
    backgroundColor: 'rgba(255,212,71,0.06)',
  },
  createIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: color.butter,
    alignItems: 'center', justifyContent: 'center', marginBottom: space.md,
  },
  createTitle: { fontFamily: font.displayMedium, fontSize: 16, color: color.cream, textAlign: 'center', marginBottom: 6 },
  createBody: { ...type.small, textAlign: 'center' },
});
