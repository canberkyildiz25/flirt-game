import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { startSync, stopSync } from '../services/sync';
import { useGameStore } from './gameStore';

interface AuthState {
  session: Session | null;
  ready: boolean;
  // Şifre sıfırlama bağlantısıyla gelindiğinde yeni şifre istenir.
  recovering: boolean;
  finishRecovery: () => void;
}

export const useAuth = create<AuthState>()((set) => ({
  session: null,
  ready: !supabase,
  recovering: false,
  finishRecovery: () => set({ recovering: false }),
}));

let started = false;

export function initAuth() {
  if (!supabase || started) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    useAuth.setState({ session, ready: true });
    if (event === 'PASSWORD_RECOVERY') useAuth.setState({ recovering: true });
    // Supabase çağrıları bu dinleyicinin içinde beklenmemeli; bir sonraki tura bırakılır.
    setTimeout(() => {
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        useGameStore.getState().confirmAdult(); // hesap açılırken 18 yaş kontrol edildi
        startSync(session.user.id);
      }
      if (event === 'SIGNED_OUT') {
        stopSync();
        useGameStore.getState().resetProgress();
      }
    }, 0);
  });
}

export async function signOut() {
  await supabase?.auth.signOut();
}
