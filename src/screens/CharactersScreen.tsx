import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore, UNLOCK_COST } from '../store/gameStore';
import { Character, RootStackParamList } from '../types';
import Portrait from '../components/Portrait';
import { useLayout } from '../navigation/layout';
import { confirmAction, notify } from '../utils/confirm';

const GAP = 16;
const SIDE = 16;
const CREATE_TILE = '__create';

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
    <TouchableOpacity
      accessibilityRole="button"
      style={[styles.card, styles.createCard, { width, minHeight: width * 1.2 + 96 }]}
      onPress={() => navigation.navigate('Create')}
      activeOpacity={0.9}
    >
      <Text style={styles.createPlus}>+</Text>
      <Text style={styles.createTitle}>Karakter oluştur</Text>
      <Text style={styles.createBody}>Kişiliğini ve görünüşünü sen seç, portresi hazırlansın.</Text>
    </TouchableOpacity>
  );
}

type Nav = StackNavigationProp<RootStackParamList, 'Characters'>;

const STAGE_LABELS: Record<string, string> = {
  stranger: 'Yabancı',
  acquaintance: 'Tanıdık',
  friend: 'Arkadaş',
  crush: 'Crush',
  romantic: 'Romantik',
  lover: 'Sevgili',
};

function CharacterCard({ character, width }: { character: Character; width: number }) {
  const navigation = useNavigation<Nav>();
  const coins = useGameStore((s) => s.coins);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const unlockCharacter = useGameStore((s) => s.unlockCharacter);

  function handleUnlock() {
    if (coins < UNLOCK_COST) {
      notify(
        'Yetersiz coin',
        `Bu karakteri açmak için ${UNLOCK_COST} 🪙 gerekiyor. Şu an ${coins} 🪙 var. Sohbet ederek coin kazanabilirsin.`
      );
      return;
    }
    confirmAction(
      'Yeni biriyle tanış',
      `Bu karakteri tanımak için ${UNLOCK_COST} 🪙 harcansın mı?`,
      `${UNLOCK_COST} 🪙 harca`,
      () => {
        spendCoins(UNLOCK_COST);
        unlockCharacter(character.id);
      }
    );
  }

  function handleCardPress() {
    if (character.isUnlocked) {
      navigation.navigate('CharacterProfile', { characterId: character.id });
    } else {
      handleUnlock();
    }
  }

  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={handleCardPress} activeOpacity={0.9}>
      <View style={[styles.imageContainer, { height: width * 1.2 }]}>
        {character.isUnlocked ? (
          <Portrait character={character} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.lockedAvatar]}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockCost}>{UNLOCK_COST} 🪙</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.imageGradient}
        />
        {character.isUnlocked && (
          <View style={[styles.stageBadge, { backgroundColor: character.color + '33', borderColor: character.color }]}>
            <Text style={[styles.stageText, { color: character.color }]}>
              {STAGE_LABELS[character.stage]}
            </Text>
          </View>
        )}
      </View>

      <LinearGradient colors={['#1a0030', '#0d001f']} style={styles.cardBottom}>
        <Text style={styles.characterName}>
          {character.isUnlocked ? character.name : '???'}
        </Text>
        <Text style={styles.characterAge}>
          {character.isUnlocked ? `${character.age} yaşında` : 'Gizemli biri...'}
        </Text>

        {character.isUnlocked && (
          <View style={styles.affectionBar}>
            <View style={styles.affectionTrack}>
              <View
                style={[
                  styles.affectionFill,
                  {
                    width: `${character.affection}%` as any,
                    backgroundColor: character.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.affectionText}>{character.affection}</Text>
          </View>
        )}

        {!character.isUnlocked && (
          <View style={styles.unlockHint}>
            <Text style={styles.unlockHintText}>Tanımak için dokun</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
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
    <LinearGradient colors={['#0a0015', '#1a0030']} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Karakterler</Text>
          <Text style={styles.headerSubtitle}>
            {unlockedCount}/{characters.length} tanışıldı
          </Text>
        </View>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>🪙 {coins}</Text>
        </View>
      </View>

      <FlatList
        data={tiles}
        keyExtractor={(item) => (item === CREATE_TILE ? item : item.id)}
        ListHeaderComponent={
          <View style={styles.filters}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.id}
                accessibilityRole="tab"
                aria-selected={filter === f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.filter, filter === f.id && styles.filterOn]}
              >
                <Text style={[styles.filterText, filter === f.id && styles.filterTextOn]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        key={columns}
        numColumns={columns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) =>
          item === CREATE_TILE ? <CreateTile width={cardWidth} /> : <CharacterCard character={item} width={cardWidth} />
        }
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  coinBadge: {
    backgroundColor: 'rgba(255,200,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filter: {
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  filterOn: { backgroundColor: 'rgba(233,30,140,0.18)', borderColor: '#E91E8C' },
  filterText: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  filterTextOn: { color: '#fff', fontWeight: '700' },
  createCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderStyle: 'dashed',
    borderColor: 'rgba(233,30,140,0.6)',
    backgroundColor: 'rgba(233,30,140,0.06)',
  },
  createPlus: { color: '#E91E8C', fontSize: 44, fontWeight: '300', marginBottom: 8 },
  createTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  createBody: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  listContent: {
    paddingHorizontal: SIDE,
    paddingBottom: 24,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  imageContainer: {
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  lockedAvatar: {
    backgroundColor: '#1a0030',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockIcon: {
    fontSize: 36,
  },
  lockCost: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '700',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  stageBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  stageText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardBottom: {
    padding: 12,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  characterAge: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  affectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  affectionTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  affectionFill: {
    height: '100%',
    borderRadius: 2,
  },
  affectionText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    width: 20,
    textAlign: 'right',
  },
  unlockHint: {
    marginTop: 8,
  },
  unlockHintText: {
    fontSize: 11,
    color: 'rgba(255,200,0,0.6)',
    fontStyle: 'italic',
  },
});
