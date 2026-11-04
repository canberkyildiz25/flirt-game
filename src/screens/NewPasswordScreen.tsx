import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../store/authStore';
import { authStyles as styles } from './AuthScreen';

// Şifre sıfırlama bağlantısından gelindiğinde açılır.
export default function NewPasswordScreen() {
  const finishRecovery = useAuth((s) => s.finishRecovery);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!supabase || busy) return;
    if (password.length < 8) return setError('Şifre en az 8 karakter olmalı.');
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (e) return setError('Şifre değiştirilemedi. Bağlantının süresi dolmuş olabilir, yeniden iste.');
    finishRecovery();
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Yeni şifre</Text>
      <Text style={styles.label}>Şifre</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="En az 8 karakter"
        placeholderTextColor="rgba(255,255,255,0.3)"
        onSubmitEditing={save}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={save} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Şifreyi kaydet</Text>}
      </TouchableOpacity>
    </View>
  );
}
