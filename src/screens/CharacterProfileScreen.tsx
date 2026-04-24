import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGameStore, STAGE_THRESHOLDS } from '../store/gameStore';
import { RootStackParamList, RelationshipStage } from '../types';

const { width, height } = Dimensions.get('window');

type Nav = StackNavigationProp<RootStackParamList, 'CharacterProfile'>;
type Route = RouteProp<RootStackParamList, 'CharacterProfile'>;

const STAGE_LABELS: Record<RelationshipStage, string> = {
  stranger: 'Yabancı',
  acquaintance: 'Tanıdık',
  friend: 'Arkadaş',
  crush: 'Crush',
  romantic: 'Romantik',
  lover: 'Sevgili 💕',
};

const STAGE_ORDER: RelationshipStage[] = [
  'stranger', 'acquaintance', 'friend', 'crush', 'romantic', 'lover',
];

export default function CharacterProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { characterId } = route.params;
  const character = useGameStore((s) => s.characters.find((c) => c.id === characterId));

  if (!character) return null;

  const currentStageIndex = STAGE_ORDER.indexOf(character.stage);

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: character.avatar }} style={styles.heroImage} />
          <LinearGradient
            colors={['rgba(10,0,21,0)', 'rgba(10,0,21,0.6)', '#0a0015']}
            style={styles.heroGradient}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <LinearGradient colors={['#0a0015', '#1a0030']} style={styles.content}>
          {/* Name & Occupation */}
          <View style={styles.nameRow}>
            <View>
              <Text style={styles.name}>{character.name}</Text>
              <Text style={styles.occupation}>{character.occupation} · {character.age} yaş</Text>
            </View>
            <View style={[styles.stagePill, { borderColor: character.color }]}>
              <Text style={[styles.stageLabel, { color: character.color }]}>
                {STAGE_LABELS[character.stage]}
              </Text>
            </View>
          </View>

          {/* Affection Bar */}
          <View style={styles.affectionSection}>
            <View style={styles.affectionHeader}>
              <Text style={styles.sectionTitle}>Bağ Seviyesi</Text>
              <Text style={[styles.affectionValue, { color: character.color }]}>
                {character.affection} / 100
              </Text>
            </View>
            <View style={styles.bigTrack}>
              <LinearGradient
                colors={[character.color + 'aa', character.color]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.bigFill, { width: `${character.affection}%` as any }]}
              />
            </View>
            {/* Stage markers */}
            <View style={styles.stageMarkers}>
              {STAGE_ORDER.map((stage, i) => (
                <View key={stage} style={styles.markerItem}>
                  <View
                    style={[
                      styles.markerDot,
                      i <= currentStageIndex && { backgroundColor: character.color },
                    ]}
                  />
                  <Text style={[
                    styles.markerLabel,
                    i <= currentStageIndex && { color: character.color },
                  ]}>
                    {STAGE_LABELS[stage].split(' ')[0]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hakkında</Text>
            <Text style={styles.bioText}>{character.bio}</Text>
          </View>

          {/* Hobbies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İlgi Alanları</Text>
            <View style={styles.hobbiesRow}>
              {character.hobbies.map((hobby) => (
                <View key={hobby} style={[styles.hobbyTag, { borderColor: character.color + '66' }]}>
                  <Text style={[styles.hobbyText, { color: character.color }]}>{hobby}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Personality */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kişilik</Text>
            <Text style={styles.bioText}>{character.personality}</Text>
          </View>

          {/* Chat Button */}
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', { characterId: character.id })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[character.color, character.color + 'bb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chatGradient}
            >
              <Text style={styles.chatButtonText}>Sohbet Başlat 💬</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0015',
  },
  heroContainer: {
    height: height * 0.5,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    marginTop: -20,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  occupation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  stagePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  affectionSection: {
    marginBottom: 28,
  },
  affectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  affectionValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  bigTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bigFill: {
    height: '100%',
    borderRadius: 4,
  },
  stageMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  markerItem: {
    alignItems: 'center',
    gap: 4,
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  markerLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.3)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  hobbiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hobbyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  hobbyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chatButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  chatGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
