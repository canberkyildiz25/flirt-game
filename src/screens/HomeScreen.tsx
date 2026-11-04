import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../store/authStore';
import { supabase } from '../services/supabase';
import { DAILY_REWARD, today, useGameStore } from '../store/gameStore';
import { Character, RootStackParamList } from '../types';
import Portrait from '../components/Portrait';
import Icon from '../components/Icon';
import { Button, CoinPill, HeartMeter, StageRibbon } from '../components/ui';
import { color, font, radius, space, type } from '../theme';
import { useLayout } from '../navigation/layout';

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;

function FeaturedCard({ character, onPress }: { character: Character; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${character.name} ile sohbet et`}
      onPress={onPress}
      style={({ pressed }) => [styles.featured, pressed && { transform: [{ translateY: 2 }] }]}
    >
      <Portrait character={character} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', 'rgba(26,15,20,0.92)']} style={styles.featuredShade} />
      <View style={styles.featuredRibbon}>
        <StageRibbon stage={character.stage} tint={color.butter} />
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName}>{character.name}</Text>
        <Text style={styles.featuredJob} numberOfLines={2}>{character.tagline ?? character.occupation}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const characters = useGameStore((s) => s.characters);
  const coins = useGameStore((s) => s.coins);
  const lastPlayedId = useGameStore((s) => s.lastPlayedCharacterId);
  const lastRewardDate = useGameStore((s) => s.lastRewardDate);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);
  const session = useAuth((s) => s.session);
  // Geniş ekranda logo ve jeton sol menüde zaten var.
  const { isWide } = useLayout();

  const unlocked = characters.filter((c) => c.isUnlocked);
  const lockedCount = characters.length - unlocked.length;
  const rewardReady = lastRewardDate !== today();
  const lastPlayed = lastPlayedId ? characters.find((c) => c.id === lastPlayedId) ?? null : null;
  // Önce en çok bağ kurulanlar; hiç konuşulmadıysa listedeki sırayla.
  const featured = [...unlocked].sort((a, b) => b.affection - a.affection).slice(0, 6);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {!isWide && (
      <View style={styles.topRow}>
        <Text style={styles.logo}>FlirtGame</Text>
        <CoinPill amount={coins} />
      </View>
      )}

      <Text style={styles.hero}>Bu gece kiminle?</Text>
      <Text style={styles.lede}>Kartını seç, ilk mesajı at. Ne kadar iyi flört edersen kalpler o kadar dolar, yeni aşamalar o kadar çabuk açılır.</Text>

      <View style={styles.ctas}>
        <Button
          label={lastPlayed ? `${lastPlayed.name} ile devam et` : 'Sohbete başla'}
          icon="chat"
          onPress={() =>
            lastPlayed ? navigation.navigate('Chat', { characterId: lastPlayed.id }) : navigation.navigate('Characters')
          }
        />
        <Button label="Kendi karakterini yarat" icon="plus" variant="ghost" onPress={() => navigation.navigate('Create')} />
      </View>

      {featured.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={type.heading}>Öne çıkanlar</Text>
            <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Characters')}>
              <Text style={styles.link}>Tüm kartlar</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
            {featured.map((c) => (
              <FeaturedCard key={c.id} character={c} onPress={() => navigation.navigate('CharacterProfile', { characterId: c.id })} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bilet şeklinde günlük ödül */}
      <View style={[styles.ticket, !rewardReady && styles.ticketUsed]}>
        <View style={styles.ticketLeft}>
          <Icon name="ticket" size={22} color={rewardReady ? color.butterInk : color.creamFaint} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.ticketTitle, !rewardReady && { color: color.cream }]}>Günlük bilet</Text>
            <Text style={[styles.ticketBody, !rewardReady && { color: color.creamFaint }]}>
              {rewardReady ? `${DAILY_REWARD} jeton. Birine kahve ısmarlamaya yeter.` : 'Bugünkünü aldın. Yarın yine uğra, özlenirsin.'}
            </Text>
          </View>
        </View>
        <View style={styles.ticketCut} />
        <Pressable
          accessibilityRole="button"
          disabled={!rewardReady}
          onPress={claimDailyReward}
          style={({ pressed }) => [styles.ticketButton, pressed && { transform: [{ translateY: 1 }] }]}
        >
          <Text style={[styles.ticketButtonText, !rewardReady && { color: color.creamFaint }]}>
            {rewardReady ? 'Al' : 'Alındı'}
          </Text>
        </Pressable>
      </View>

      {lastPlayed && (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Conversations')}
          style={({ pressed }) => [styles.recent, pressed && { backgroundColor: color.ink3 }]}
        >
          <Portrait character={lastPlayed} style={styles.recentAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={type.bodyStrong}>Sohbetlerin</Text>
            <Text style={type.small}>Son: {lastPlayed.name}</Text>
          </View>
          <HeartMeter value={lastPlayed.affection} size={13} />
        </Pressable>
      )}

      {supabase && !session && (
        <View style={styles.signup}>
          <Text style={type.bodyStrong}>Seni unutmasınlar</Text>
          <Text style={type.small}>Kayıt ol; jetonların, kartların ve sohbetlerin her cihazda seninle olsun.</Text>
          <Button label="Kayıt ol" variant="reward" compact style={{ alignSelf: 'flex-start', marginTop: space.md }} onPress={() => navigation.navigate('Auth', { mode: 'signup' })} />
        </View>
      )}

      {lockedCount > 0 && <Text style={styles.footnote}>{lockedCount} kişi hâlâ seni tanımıyor. Jeton biriktir, kilidi aç.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ink },
  content: { padding: space.xl, paddingTop: 48, paddingBottom: 48 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  logo: { fontFamily: font.display, fontSize: 18, color: color.red },
  hero: { ...type.hero, fontSize: 40, lineHeight: 46, marginBottom: space.md },
  lede: { ...type.body, maxWidth: 440, marginBottom: space.xl },
  ctas: { gap: space.md, marginBottom: 40 },
  section: { marginBottom: space.xxl },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.md },
  link: { fontFamily: font.medium, fontSize: 14, color: color.butter },
  featuredRow: { gap: space.md, paddingRight: space.xl },
  featured: {
    width: 150,
    height: 210,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: color.cream,
    overflow: 'hidden',
    backgroundColor: color.ink3,
  },
  featuredShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  featuredRibbon: { position: 'absolute', top: space.sm, left: space.sm },
  featuredInfo: { position: 'absolute', left: space.md, right: space.md, bottom: space.md },
  featuredName: { fontFamily: font.displayMedium, fontSize: 16, color: color.cream },
  featuredJob: { fontFamily: font.body, fontSize: 12, color: color.creamDim },
  ticket: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.md,
    backgroundColor: color.butter,
    marginBottom: space.lg,
    overflow: 'hidden',
  },
  ticketUsed: { backgroundColor: color.ink2, borderWidth: 1, borderColor: color.line },
  ticketLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  ticketTitle: { fontFamily: font.displayMedium, fontSize: 15, color: color.butterInk },
  ticketBody: { fontFamily: font.medium, fontSize: 13, color: 'rgba(42,26,10,0.75)' },
  ticketCut: { width: 0, borderLeftWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(42,26,10,0.35)', marginVertical: space.sm },
  ticketButton: { paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center' },
  ticketButtonText: { fontFamily: font.display, fontSize: 15, color: color.butterInk },
  recent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: color.ink2,
    borderWidth: 1,
    borderColor: color.line,
    marginBottom: space.lg,
  },
  recentAvatar: { width: 44, height: 44, borderRadius: 22 },
  signup: {
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    borderStyle: 'dashed',
    marginBottom: space.lg,
  },
  footnote: { ...type.small, textAlign: 'center', marginTop: space.md },
});
