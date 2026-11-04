import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { RootStackParamList } from '../types';
import { navigationRef } from './ref';
import { signOut, useAuth } from '../store/authStore';
import { supabase } from '../services/supabase';
import Icon, { IconName } from '../components/Icon';
import { Button, CoinPill } from '../components/ui';
import { color, font, radius, space } from '../theme';

type Destination = 'Home' | 'Characters' | 'Create' | 'Conversations';

const ITEMS: { route: Destination; label: string; icon: IconName }[] = [
  { route: 'Home', label: 'Ana sayfa', icon: 'home' },
  { route: 'Characters', label: 'Kartlar', icon: 'cards' },
  { route: 'Create', label: 'Karakter yarat', icon: 'plus' },
  { route: 'Conversations', label: 'Sohbetlerim', icon: 'chat' },
];

// Profil ve sohbet, açıldıkları listenin altında sayılır.
const PARENT: Partial<Record<keyof RootStackParamList, Destination>> = {
  CharacterProfile: 'Characters',
  Chat: 'Conversations',
};

const go = (route: Destination | 'Auth') => {
  if (!navigationRef.isReady()) return;
  if (route === 'Auth') navigationRef.navigate('Auth', { mode: 'login' });
  else navigationRef.navigate(route);
};

export default function Sidebar({ current }: { current?: keyof RootStackParamList }) {
  const coins = useGameStore((s) => s.coins);
  const chats = useGameStore((s) => Object.keys(s.conversations).length);
  const active = current ? PARENT[current] ?? current : 'Home';
  const session = useAuth((s) => s.session);

  return (
    <View style={styles.root}>
      <Text style={styles.logo}>FlirtGame</Text>
      <View style={styles.nav}>
        {ITEMS.map((item) => {
          const isActive = item.route === active;
          return (
            <Pressable
              key={item.route}
              accessibilityRole="link"
              aria-selected={isActive}
              onPress={() => go(item.route)}
              style={({ pressed }) => [styles.item, isActive && styles.itemActive, pressed && !isActive && styles.itemPressed]}
            >
              <Icon name={item.icon} size={18} color={isActive ? color.ink : color.creamDim} />
              <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{item.label}</Text>
              {item.route === 'Conversations' && chats > 0 && (
                <Text style={[styles.count, isActive && { color: color.ink }]}>{chats}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <CoinPill amount={coins} />
        {supabase &&
          (session ? (
            <View style={styles.account}>
              <Text style={styles.email} numberOfLines={1}>{session.user.email}</Text>
              <Pressable accessibilityRole="button" onPress={signOut}>
                <Text style={styles.accountLink}>Çıkış yap</Text>
              </Pressable>
            </View>
          ) : (
            <Button label="Giriş yap" variant="reward" compact onPress={() => go('Auth')} />
          ))}
        <Text style={styles.note}>Karakterler kurgusaldır, sohbetlere yapay zekâ cevap verir.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 232,
    paddingTop: space.xxl,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    borderRightWidth: 1,
    borderRightColor: color.line,
    backgroundColor: '#140B10',
  },
  logo: { fontFamily: font.display, fontSize: 20, color: color.red, paddingHorizontal: space.md, marginBottom: space.xxl },
  nav: { gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    minHeight: 44,
    borderRadius: radius.md,
  },
  itemActive: { backgroundColor: color.cream },
  itemPressed: { backgroundColor: color.ink3 },
  itemText: { flex: 1, fontFamily: font.medium, fontSize: 15, color: color.creamDim },
  itemTextActive: { fontFamily: font.bold, color: color.ink },
  count: { fontFamily: font.bold, fontSize: 13, color: color.butter },
  footer: { marginTop: 'auto', gap: space.md, alignItems: 'flex-start' },
  account: { gap: 4, alignSelf: 'stretch' },
  email: { fontFamily: font.body, fontSize: 13, color: color.creamDim },
  accountLink: { fontFamily: font.medium, fontSize: 13, color: color.creamFaint, textDecorationLine: 'underline' },
  note: { fontFamily: font.body, fontSize: 12, lineHeight: 17, color: color.creamFaint },
});
