import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Publishable anahtar herkese açıktır; veriyi veritabanındaki satır kuralları korur.
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          // E-posta onayı ve şifre sıfırlama bağlantıları web adresine döner.
          detectSessionInUrl: Platform.OS === 'web',
        },
      })
    : null;
