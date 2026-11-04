import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore } from '../store/gameStore';
import { RootStackParamList } from '../types';
import Portrait from '../components/Portrait';
import Icon from '../components/Icon';
import { Button, HeartMeter, IconButton, STAGE_LABELS, StageRibbon } from '../components/ui';
import { STAGE_ORDER } from '../utils/characterUtils';
import { color, font, radius, space, type } from '../theme';

type Nav = StackNavigationProp<RootStackParamList, 'CharacterProfile'>;
type Route = RouteProp<RootStackParamList, 'CharacterProfile'>;

export default function CharacterProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { characterId } = route.params;
  const character = useGameStore((s) => s.characters.find((c) => c.id === characterId));

  if (!character) return null;

  const stageIndex = STAGE_ORDER.indexOf(character.stage);
  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Characters'));

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <IconButton icon="back" label="Geri" onPress={back} />
        </View>

        {/* Büyük kart: profilin kendisi koleksiyon kartının yakın çekimi */}
        <View style={styles.card}>
          <View style={styles.photo}>
            <Portrait character={character} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['transparent', 'rgba(26,15,20,0.95)']} style={styles.shade} />
            <View style={styles.ribbon}>
              <StageRibbon stage={character.stage} tint={color.butter} />
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.name}>{character.name}</Text>
              <Text style={styles.job}>{character.occupation} · {character.age}</Text>
            </View>
          </View>
          <View style={styles.meter}>
            <HeartMeter value={character.affection} size={18} />
            <Text style={styles.meterText}>{character.affection} / 100</Text>
          </View>
        </View>

        <Button
          label={`${character.name} ile sohbet et`}
          icon="chat"
          onPress={() => navigation.navigate('Chat', { characterId: character.id })}
          style={styles.cta}
        />

        {/* Aşama yolu: her aşama sohbet ettikçe açılır */}
        <Text style={styles.label}>AŞAMALAR</Text>
        <View style={styles.path}>
          {STAGE_ORDER.map((stage, i) => {
            const reached = i <= stageIndex;
            return (
              <View key={stage} style={styles.step}>
                <View style={[styles.dot, reached && styles.dotOn, i === stageIndex && styles.dotNow]}>
                  {reached ? <Icon name="heart" size={12} color={color.ink} /> : <Icon name="lock" size={11} color={color.creamFaint} />}
                </View>
                <Text style={[styles.stepText, reached && styles.stepTextOn]} numberOfLines={1}>
                  {STAGE_LABELS[stage]}
                </Text>
              </View>
            );
          })}
        </View>

        {!!character.bio && (
          <>
            <Text style={styles.label}>HAKKINDA</Text>
            <Text style={styles.bio}>{character.bio}</Text>
          </>
        )}

        <Text style={styles.label}>KİŞİLİK</Text>
        <Text style={styles.bio}>{character.personality}</Text>

        {character.hobbies.length > 0 && (
          <>
            <Text style={styles.label}>İLGİ ALANLARI</Text>
            <View style={styles.tags}>
              {character.hobbies.map((h) => (
                <View key={h} style={styles.tag}>
                  <Text style={styles.tagText}>{h}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ink },
  content: { padding: space.xl, paddingTop: 40, paddingBottom: 48 },
  top: { marginBottom: space.lg },
  card: {
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: color.cream,
    backgroundColor: color.ink2,
    overflow: 'hidden',
    marginBottom: space.lg,
  },
  photo: { aspectRatio: 4 / 5, backgroundColor: color.ink3 },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' },
  ribbon: { position: 'absolute', top: space.md, left: space.md },
  nameBlock: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg },
  name: { ...type.hero, fontSize: 36, lineHeight: 42 },
  job: { fontFamily: font.medium, fontSize: 15, color: color.creamDim, marginTop: 2 },
  meter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  meterText: { fontFamily: font.bold, fontSize: 14, color: color.creamDim },
  cta: { marginBottom: space.xxl },
  label: { ...type.label, marginBottom: space.md },
  path: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.xxl },
  step: { alignItems: 'center', gap: 6, flex: 1 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.ink2,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
  },
  dotOn: { backgroundColor: color.butter, borderColor: color.butter },
  dotNow: { borderColor: color.cream, borderWidth: 3 },
  stepText: { fontFamily: font.medium, fontSize: 11, color: color.creamFaint },
  stepTextOn: { color: color.cream },
  bio: { ...type.body, marginBottom: space.xl },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tag: {
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.ink2,
    borderWidth: 1,
    borderColor: color.lineStrong,
  },
  tagText: { fontFamily: font.medium, fontSize: 13, color: color.cream },
});
