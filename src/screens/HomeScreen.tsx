import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore } from '../store/gameStore';
import { RootStackParamList } from '../types';
import { getStageAvatar } from '../utils/characterUtils';

const { width, height } = Dimensions.get('window');

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;

const STAGE_LABELS: Record<string, string> = {
  stranger: 'Yabancı',
  acquaintance: 'Tanıdık',
  friend: 'Arkadaş',
  crush: 'Crush',
  romantic: 'Romantik',
  lover: 'Sevgili',
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const characters = useGameStore((s) => s.characters);
  const coins = useGameStore((s) => s.coins);
  const lastPlayedId = useGameStore((s) => s.lastPlayedCharacterId);

  const unlockedCount = characters.filter((c) => c.isUnlocked).length;
  const totalAffection = characters.reduce((sum, c) => sum + c.affection, 0);
  const bestCharacter = characters
    .filter((c) => c.isUnlocked)
    .sort((a, b) => b.affection - a.affection)[0] ?? null;
  const lastPlayed = lastPlayedId
    ? characters.find((c) => c.id === lastPlayedId) ?? null
    : null;

  return (
    <LinearGradient colors={['#0a0015', '#1a0030', '#2d0050']} style={styles.container}>
      {/* Decorative orbs */}
      <View style={styles.orbContainer} pointerEvents="none">
        <View style={styles.orb} />
        <View style={[styles.orb, styles.orbSecond]} />
      </View>

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.heartEmoji}>💝</Text>
          <Text style={styles.title}>FlirtGame</Text>
          <Text style={styles.subtitle}>Kalbini dinle, seçimini yap</Text>
        </View>

        {/* Coin + Stats Bar */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Tanışılan</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FFD700' }]}>🪙 {coins}</Text>
            <Text style={styles.statLabel}>Coin</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalAffection}</Text>
            <Text style={styles.statLabel}>Toplam 💕</Text>
          </View>
        </View>

        {/* Son konuşulan karakter */}
        {lastPlayed && (
          <TouchableOpacity
            style={styles.lastPlayedCard}
            onPress={() => navigation.navigate('Chat', { characterId: lastPlayed.id })}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: getStageAvatar(lastPlayed) }}
              style={styles.lastPlayedAvatar}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.lastPlayedGradient}
            />
            <View style={styles.lastPlayedInfo}>
              <Text style={styles.lastPlayedLabel}>Son Konuşma</Text>
              <Text style={styles.lastPlayedName}>{lastPlayed.name}</Text>
              <View style={[styles.stagePill, { borderColor: lastPlayed.color }]}>
                <Text style={[styles.stagePillText, { color: lastPlayed.color }]}>
                  {STAGE_LABELS[lastPlayed.stage]} · {lastPlayed.affection}/100 💕
                </Text>
              </View>
            </View>
            <View style={[styles.continueBtn, { backgroundColor: lastPlayed.color }]}>
              <Text style={styles.continueBtnText}>Devam</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* En iyi bağ */}
        {bestCharacter && bestCharacter.affection > 0 && bestCharacter.id !== lastPlayedId && (
          <View style={styles.bestCard}>
            <Text style={styles.bestLabel}>En Güçlü Bağ</Text>
            <View style={styles.bestRow}>
              <Image
                source={{ uri: getStageAvatar(bestCharacter) }}
                style={styles.bestAvatar}
              />
              <View style={styles.bestInfo}>
                <Text style={styles.bestName}>{bestCharacter.name}</Text>
                <View style={styles.bestBarTrack}>
                  <View
                    style={[
                      styles.bestBarFill,
                      { width: `${bestCharacter.affection}%` as any, backgroundColor: bestCharacter.color },
                    ]}
                  />
                </View>
                <Text style={[styles.bestStage, { color: bestCharacter.color }]}>
                  {STAGE_LABELS[bestCharacter.stage]}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Ana buton */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Characters')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#E91E8C', '#9C27B0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.primaryButtonText}>
              {unlockedCount === 0 ? 'Karakterleri Keşfet' : 'Karakterlere Bak'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {characters.length - unlockedCount > 0
            ? `${characters.length - unlockedCount} gizemli karakter seni bekliyor 🔒`
            : 'Tüm karakterleri tanıdın! 🎉'}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orbContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  orb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(233,30,140,0.08)',
    top: height * 0.3,
    left: -50,
  },
  orbSecond: {
    backgroundColor: 'rgba(156,39,176,0.08)',
    top: height * 0.5,
    right: -50,
    left: undefined,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  heartEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: '#E91E8C',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
    letterSpacing: 1,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E91E8C',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  lastPlayedCard: {
    width: '100%',
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lastPlayedAvatar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  lastPlayedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  lastPlayedInfo: {
    flex: 1,
    padding: 16,
    zIndex: 1,
  },
  lastPlayedLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  lastPlayedName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  stagePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  continueBtn: {
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 1,
    alignSelf: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  bestCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 16,
  },
  bestLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  bestInfo: {
    flex: 1,
    gap: 4,
  },
  bestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bestBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bestBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  bestStage: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 4,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
});
