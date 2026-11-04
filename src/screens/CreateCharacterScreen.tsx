import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import {
  HAIR_COLORS, HAIR_STYLES, HOBBIES, OCCUPATIONS, OUTFITS, PERSONALITIES, SPEAKING_STYLES, Option,
} from '../data/creatorOptions';
import { characterFromRow } from '../data/customCharacters';
import { authHeader } from '../services/aiService';
import { useAuth } from '../store/authStore';
import { useGameStore } from '../store/gameStore';

type Nav = StackNavigationProp<RootStackParamList, 'Create'>;

const API_URL = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/characters`;
const ACCENT = '#E91E8C';

const ERRORS: Record<string, string> = {
  daily_limit: 'Bugün en fazla 3 karakter oluşturabilirsin. Yarın yine dene.',
  portrait_rejected: 'Portre bu seçimlerle üretilemedi. Saç ya da kıyafet seçimini değiştirip tekrar dene.',
  invalid: 'Bazı seçimler eksik. Her bölümden en az bir seçim yap.',
  rate_limited: 'Biraz yavaşlayalım, bir dakika sonra tekrar dene.',
};

function Chips({
  options, selected, onToggle,
}: { options: Option[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <TouchableOpacity
            key={o.id}
            accessibilityRole="checkbox"
            aria-checked={on}
            onPress={() => onToggle(o.id)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Tekli seçimde aynı seçeneğe basmak değiştirmez; çokluda en fazla `max` seçilir.
const single = (set: (v: string) => void) => (id: string) => set(id);
const multi = (list: string[], set: (v: string[]) => void, max: number) => (id: string) =>
  set(list.includes(id) ? list.filter((x) => x !== id) : list.length < max ? [...list, id] : list);

export default function CreateCharacterScreen() {
  const navigation = useNavigation<Nav>();
  const session = useAuth((s) => s.session);
  const addCustomCharacter = useGameStore((s) => s.addCustomCharacter);

  const [name, setName] = useState('');
  const [age, setAge] = useState(26);
  const [occupation, setOccupation] = useState('');
  const [personalities, setPersonalities] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [hairStyle, setHairStyle] = useState('');
  const [outfit, setOutfit] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    name.trim() && occupation && personalities.length && hobbies.length && speakingStyle && hairColor && hairStyle && outfit;

  async function create() {
    if (busy) return;
    if (!session) return navigation.navigate('Auth', { mode: 'signup' });
    if (!ready) return setError(ERRORS.invalid);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({
          name, age, occupation, personalities, hobbies, speakingStyle, bio,
          look: { hairColor, hairStyle, outfit },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) return navigation.navigate('Auth', { mode: 'login' });
        return setError(ERRORS[body.error] ?? 'Karakter oluşturulamadı. Biraz sonra tekrar dene.');
      }
      const character = characterFromRow(body.character);
      addCustomCharacter(character);
      navigation.replace('CharacterProfile', { characterId: character.id });
    } catch {
      setError('Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Karakter oluştur</Text>
      <Text style={styles.body}>
        Seçimlerine göre kurgusal, 18 yaşından büyük bir karakter ve portresi hazırlanır. Günde en fazla 3 karakter.
      </Text>

      <Text style={styles.label}>Adı</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        maxLength={20}
        placeholder="Örneğin Defne"
        placeholderTextColor="rgba(255,255,255,0.3)"
      />

      <Text style={styles.label}>Yaşı: {age}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity accessibilityLabel="Yaşı azalt" style={styles.stepButton} onPress={() => setAge((a) => Math.max(18, a - 1))}>
          <Text style={styles.stepText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Yaşı artır" style={styles.stepButton} onPress={() => setAge((a) => Math.min(45, a + 1))}>
          <Text style={styles.stepText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Mesleği</Text>
      <Chips options={OCCUPATIONS} selected={[occupation]} onToggle={single(setOccupation)} />

      <Text style={styles.label}>Kişiliği (en fazla 3)</Text>
      <Chips options={PERSONALITIES} selected={personalities} onToggle={multi(personalities, setPersonalities, 3)} />

      <Text style={styles.label}>İlgi alanları (en fazla 3)</Text>
      <Chips options={HOBBIES} selected={hobbies} onToggle={multi(hobbies, setHobbies, 3)} />

      <Text style={styles.label}>Konuşma tarzı</Text>
      <Chips options={SPEAKING_STYLES} selected={[speakingStyle]} onToggle={single(setSpeakingStyle)} />

      <Text style={styles.label}>Saç rengi</Text>
      <Chips options={HAIR_COLORS} selected={[hairColor]} onToggle={single(setHairColor)} />

      <Text style={styles.label}>Saç modeli</Text>
      <Chips options={HAIR_STYLES} selected={[hairStyle]} onToggle={single(setHairStyle)} />

      <Text style={styles.label}>Tarzı</Text>
      <Chips options={OUTFITS} selected={[outfit]} onToggle={single(setOutfit)} />

      <Text style={styles.label}>Kısa tanıtım (isteğe bağlı)</Text>
      <TextInput
        style={[styles.input, styles.bio]}
        value={bio}
        onChangeText={setBio}
        maxLength={240}
        multiline
        placeholder="Nerede yaşıyor, neyi seviyor?"
        placeholderTextColor="rgba(255,255,255,0.3)"
      />
      <Text style={styles.small}>{bio.length}/240</Text>

      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.primary, (!ready || busy) && styles.primaryDim]}
        onPress={create}
        disabled={busy}
      >
        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.primaryText}>Portre hazırlanıyor, 20 saniye kadar sürer</Text>
          </View>
        ) : (
          <Text style={styles.primaryText}>{session ? 'Oluştur' : 'Oluşturmak için kayıt ol'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0015' },
  content: { padding: 24, paddingTop: 56, paddingBottom: 48 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 8 },
  body: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 22 },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginTop: 22, marginBottom: 10 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  bio: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  small: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  chipOn: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  chipTextOn: { color: '#fff', fontWeight: '700' },
  stepper: { flexDirection: 'row', gap: 10 },
  stepButton: {
    width: 48, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stepText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  error: { color: '#FF8A8A', fontSize: 14, marginTop: 18, lineHeight: 20 },
  primary: { backgroundColor: ACCENT, borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingHorizontal: 16 },
  primaryDim: { opacity: 0.6 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
