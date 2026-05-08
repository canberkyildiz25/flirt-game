import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore, UNLOCK_COST } from '../store/gameStore';
import { Character, RootStackParamList } from '../types';
import { getStageAvatar } from '../utils/characterUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

type Nav = StackNavigationProp<RootStackParamList, 'Characters'>;

const STAGE_LABELS: Record<string, string> = {
  stranger: 'Yabancı',
  acquaintance: 'Tanıdık',
  friend: 'Arkadaş',
  crush: 'Crush',
  romantic: 'Romantik',
  lover: 'Sevgili',
};

function CharacterCard({ character }: { character: Character }) {
  const navigation = useNavigation<Nav>();
  const coins = useGameStore((s) => s.coins);
  const spendCoins = useGameStore((s) => s.spendCoins);
  const unlockCharacter = useGameStore((s) => s.unlockCharacter);

  function handleUnlock() {
    if (coins < UNLOCK_COST) {
      Alert.alert(
        'Yetersiz Coin',
        `Bu karakteri açmak için ${UNLOCK_COST} 🪙 gerekiyor.\nŞu an ${coins} 🪙 var.\nDaha fazla sohbet ederek coin kazan!`,
        [{ text: 'Tamam' }]
      );
      return;
    }
    Alert.alert(
      `${character.name}'i Tanı`,
      `Bu gizemli karakteri tanımak için ${UNLOCK_COST} 🪙 harcamak istiyor musun?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: `${UNLOCK_COST} 🪙 Harca`,
          onPress: () => {
            spendCoins(UNLOCK_COST);
            unlockCharacter(character.id);
          },
        },
      ]
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
    <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        {character.isUnlocked ? (
          <Image source={{ uri: getStageAvatar(character) }} style={styles.avatar} />
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
        data={characters}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <CharacterCard character={item} />}
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  imageContainer: {
    position: 'relative',
    height: CARD_WIDTH * 1.2,
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
