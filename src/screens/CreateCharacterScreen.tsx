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
import { Button, Chip } from '../components/ui';
import { color, font, radius, space, type } from '../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Create'>;

const API_URL = `${process.env.EXPO_PUBLIC_API_URL ?? ''}/api/characters`;

const ERRORS: Record<string, string> = {
  daily_limit: 'Bugün en fazla 3 karakter oluşturabilirsin. Yarın yine dene.',
  portrait_rejected: 'Portre bu seçimlerle üretilemedi. Saç ya da kıyafet seçimini değiştirip tekrar dene.',
  invalid: 'Bazı seçimler eksik. Her bölümden en az bir seçim yap.',
  inappropriate: 'Ad ya da tanıtım bu oyuna uygun değil. Cinsel içerik ve reşit olmayanlara gönderme kabul edilmiyor.',
  rate_limited: 'Biraz yavaşlayalım, bir dakika sonra tekrar dene.',
};

function Chips({
  options, selected, onToggle,
}: { options: Option[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip key={o.id} label={o.label} selected={selected.includes(o.id)} onPress={() => onToggle(o.id)} />
      ))}
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
        Hayalindeki karakteri kur: adı, tarzı, konuşması. Kurgusal ve 18 yaşından büyük olur, portresi 20 saniyede hazır. Günde en fazla 3 karakter.
      </Text>

      <Text style={styles.label}>Adı</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        maxLength={20}
        placeholder="Örneğin Defne"
        placeholderTextColor={color.creamFaint}
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
        placeholderTextColor={color.creamFaint}
      />
      <Text style={styles.small}>{bio.length}/240</Text>

      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}

      <Button
        label={busy ? 'Portre hazırlanıyor, 20 saniye kadar sürer' : session ? 'Kartı oluştur' : 'Oluşturmak için kayıt ol'}
        icon={busy ? undefined : 'spark'}
        busy={false}
        disabled={busy}
        onPress={create}
        style={[styles.primary, !ready && { opacity: 0.6 }]}
      />
      {busy && <ActivityIndicator color={color.butter} style={{ marginTop: space.md }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ink },
  content: { padding: space.xl, paddingTop: 56, paddingBottom: 48 },
  title: { ...type.title, marginBottom: space.sm },
  body: { ...type.body },
  label: { ...type.label, marginTop: space.xl, marginBottom: space.md },
  input: {
    backgroundColor: color.ink2,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    borderRadius: radius.md,
    color: color.cream,
    fontFamily: font.body,
    fontSize: 16,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  bio: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  small: { ...type.small, marginTop: 6, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stepper: { flexDirection: 'row', gap: space.md },
  stepButton: {
    width: 52, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.ink2, borderWidth: 1.5, borderColor: color.lineStrong,
  },
  stepText: { fontFamily: font.display, color: color.cream, fontSize: 18 },
  error: { fontFamily: font.medium, color: color.danger, fontSize: 14, marginTop: space.lg, lineHeight: 20 },
  primary: { marginTop: space.xl },
});
