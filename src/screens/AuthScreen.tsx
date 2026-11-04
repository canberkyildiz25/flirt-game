import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../services/supabase';
import { RootStackParamList } from '../types';

type Mode = 'login' | 'signup' | 'reset';
type Nav = StackNavigationProp<RootStackParamList, 'Auth'>;
type Route = RouteProp<RootStackParamList, 'Auth'>;

const TITLES: Record<Mode, string> = {
  login: 'Giriş yap',
  signup: 'Kayıt ol',
  reset: 'Şifreni sıfırla',
};

// Supabase hata kodlarının Türkçesi; bilinmeyenler genel mesaja düşer.
const ERRORS: Record<string, string> = {
  invalid_credentials: 'E-posta ya da şifre hatalı.',
  user_already_exists: 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.',
  email_exists: 'Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.',
  email_not_confirmed: 'Önce e-postana gelen bağlantıyla hesabını onayla.',
  weak_password: 'Şifre çok zayıf. En az 8 karakter, harf ve rakam kullan.',
  over_email_send_rate_limit: 'Çok fazla e-posta istendi. Birkaç dakika sonra tekrar dene.',
  over_request_rate_limit: 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.',
  validation_failed: 'E-posta adresini kontrol et.',
};

function age(birth: Date): number {
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) years -= 1;
  return years;
}

function parseBirthDate(day: string, month: string, year: string): Date | null {
  const d = Number(day), m = Number(month), y = Number(year);
  if (!d || !m || y < 1900) return null;
  const date = new Date(y, m - 1, d);
  // 31 Şubat gibi tarihleri Date sessizce kaydırır; geri kontrol edilir.
  return date.getDate() === d && date.getMonth() === m - 1 ? date : null;
}

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function AuthScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!supabase) {
    return (
      <View style={styles.root}>
        <Text style={styles.body}>Üyelik şu an kapalı.</Text>
      </View>
    );
  }

  const redirectTo = Platform.OS === 'web' ? window.location.origin : undefined;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  function leave() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  }

  async function submit() {
    if (!supabase || busy) return;
    setError(null);
    setNotice(null);
    const address = email.trim();
    if (!address.includes('@')) return setError('Geçerli bir e-posta adresi yaz.');

    if (mode === 'signup') {
      const birth = parseBirthDate(day, month, year);
      if (!birth) return setError('Doğum tarihini gün, ay, yıl olarak doğru gir.');
      if (age(birth) < 18) return setError('Bu oyun 18 yaşından büyükler için. Kayıt olamazsın.');
      if (password.length < 8) return setError('Şifre en az 8 karakter olmalı.');
    }
    if (mode === 'login' && !password) return setError('Şifreni yaz.');

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error: e } = await supabase.auth.signInWithPassword({ email: address, password });
        if (e) throw e;
        leave();
      } else if (mode === 'signup') {
        const birth = parseBirthDate(day, month, year)!;
        const { data, error: e } = await supabase.auth.signUp({
          email: address,
          password,
          options: { data: { birth_date: iso(birth) }, emailRedirectTo: redirectTo },
        });
        if (e) throw e;
        if (data.session) leave();
        else setNotice(`${address} adresine bir onay bağlantısı gönderdik. Bağlantıya tıklayınca hesabın açılır.`);
      } else {
        const { error: e } = await supabase.auth.resetPasswordForEmail(address, { redirectTo });
        if (e) throw e;
        setNotice('Bu e-postayla bir hesap varsa şifre sıfırlama bağlantısı gönderdik.');
      }
    } catch (e: any) {
      setError(ERRORS[e?.code] ?? 'Bir şeyler ters gitti. Biraz sonra tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Geri" onPress={leave} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{TITLES[mode]}</Text>
      {mode === 'signup' && (
        <Text style={styles.body}>Hesabınla coinlerin, ilerlemen ve sohbetlerin her cihazda seninle gelir.</Text>
      )}

      <Text style={styles.label}>E-posta</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="ornek@eposta.com"
        placeholderTextColor="rgba(255,255,255,0.3)"
      />

      {mode !== 'reset' && (
        <>
          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder={mode === 'signup' ? 'En az 8 karakter' : ''}
            placeholderTextColor="rgba(255,255,255,0.3)"
            onSubmitEditing={submit}
          />
        </>
      )}

      {mode === 'signup' && (
        <>
          <Text style={styles.label}>Doğum tarihi</Text>
          <View style={styles.dateRow}>
            <TextInput style={[styles.input, styles.dateShort]} value={day} onChangeText={setDay} placeholder="Gün" keyboardType="number-pad" maxLength={2} placeholderTextColor="rgba(255,255,255,0.3)" />
            <TextInput style={[styles.input, styles.dateShort]} value={month} onChangeText={setMonth} placeholder="Ay" keyboardType="number-pad" maxLength={2} placeholderTextColor="rgba(255,255,255,0.3)" />
            <TextInput style={[styles.input, styles.dateLong]} value={year} onChangeText={setYear} placeholder="Yıl" keyboardType="number-pad" maxLength={4} placeholderTextColor="rgba(255,255,255,0.3)" />
          </View>
          <Text style={styles.small}>18 yaşından küçükler kayıt olamaz.</Text>
        </>
      )}

      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
      {notice && <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text>}

      <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{TITLES[mode]}</Text>}
      </TouchableOpacity>

      <View style={styles.links}>
        {mode !== 'login' && (
          <TouchableOpacity onPress={() => switchMode('login')}>
            <Text style={styles.link}>Hesabın var mı? Giriş yap</Text>
          </TouchableOpacity>
        )}
        {mode !== 'signup' && (
          <TouchableOpacity onPress={() => switchMode('signup')}>
            <Text style={styles.link}>Hesabın yok mu? Kayıt ol</Text>
          </TouchableOpacity>
        )}
        {mode === 'login' && (
          <TouchableOpacity onPress={() => switchMode('reset')}>
            <Text style={styles.link}>Şifremi unuttum</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0015', paddingHorizontal: 24, paddingTop: 56, maxWidth: 440, width: '100%', alignSelf: 'center' },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  backText: { color: '#fff', fontSize: 18 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 8 },
  body: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 22, marginBottom: 8 },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 16, marginBottom: 6 },
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
  dateRow: { flexDirection: 'row', gap: 8 },
  dateShort: { flex: 1 },
  dateLong: { flex: 1.6 },
  small: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 6 },
  error: { color: '#FF8A8A', fontSize: 14, marginTop: 16, lineHeight: 20 },
  notice: { color: '#9BE7B4', fontSize: 14, marginTop: 16, lineHeight: 20 },
  primary: { backgroundColor: '#E91E8C', borderRadius: 12, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  links: { marginTop: 20, gap: 12, alignItems: 'center' },
  link: { color: 'rgba(255,255,255,0.65)', fontSize: 14, textDecorationLine: 'underline' },
});

const styles = authStyles;
