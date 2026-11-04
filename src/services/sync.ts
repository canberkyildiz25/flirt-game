import { supabase } from './supabase';
import { useGameStore, GameSnapshot } from '../store/gameStore';

const PUSH_DELAY_MS = 1500;

let currentUser: string | null = null;
let unsubscribe: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function snapshot(): GameSnapshot {
  const { characters, coins, conversations, lastRewardDate } = useGameStore.getState();
  return { characters, coins, conversations, lastRewardDate };
}

// Yalnızca değişen satırlar yazılır; zustand değişmeyen nesnelerin referansını korur.
async function push(userId: string, before: GameSnapshot | null, after: GameSnapshot) {
  if (!supabase) return;
  const writes: PromiseLike<{ error: unknown }>[] = [];

  if (!before || before.coins !== after.coins || before.lastRewardDate !== after.lastRewardDate) {
    writes.push(
      supabase.from('profiles').update({ coins: after.coins, last_reward_date: after.lastRewardDate }).eq('id', userId)
    );
  }

  const changedProgress = after.characters.filter(
    (c) => !before || before.characters.find((b) => b.id === c.id) !== c
  );
  if (changedProgress.length) {
    writes.push(
      supabase.from('character_progress').upsert(
        changedProgress.map((c) => ({
          user_id: userId,
          character_id: c.id,
          affection: c.affection,
          stage: c.stage,
          is_unlocked: c.isUnlocked,
          updated_at: new Date().toISOString(),
        }))
      )
    );
  }

  const changedChats = Object.entries(after.conversations).filter(
    ([id, convo]) => !before || before.conversations[id] !== convo
  );
  if (changedChats.length) {
    writes.push(
      supabase.from('conversations').upsert(
        changedChats.map(([id, convo]) => ({
          user_id: userId,
          character_id: id,
          messages: convo.messages,
          history: convo.history,
          updated_at: new Date(convo.updatedAt).toISOString(),
        }))
      )
    );
  }

  const removed = before
    ? Object.keys(before.conversations).filter((id) => !after.conversations[id])
    : [];
  if (removed.length) {
    writes.push(supabase.from('conversations').delete().eq('user_id', userId).in('character_id', removed));
  }

  const results = await Promise.all(writes);
  results.forEach(({ error }) => error && console.warn('sync failed', error));
}

export async function startSync(userId: string) {
  if (!supabase || currentUser === userId) return;
  stopSync();
  currentUser = userId;

  const [profile, progress, chats, custom] = await Promise.all([
    supabase.from('profiles').select('coins, last_reward_date').eq('id', userId).maybeSingle(),
    supabase.from('character_progress').select('*').eq('user_id', userId),
    supabase.from('conversations').select('*').eq('user_id', userId),
    supabase.from('custom_characters').select('*').eq('user_id', userId).order('created_at'),
  ]);
  if (currentUser !== userId) return; // bu arada çıkış yapıldı

  const hasServerData =
    (progress.data?.length ?? 0) > 0 || (chats.data?.length ?? 0) > 0 || (custom.data?.length ?? 0) > 0;
  if (hasServerData) {
    useGameStore.getState().applyServerState({
      coins: profile.data?.coins,
      lastRewardDate: profile.data?.last_reward_date,
      custom: custom.data ?? [],
      progress: progress.data ?? [],
      conversations: chats.data ?? [],
    });
  } else {
    // Yeni hesap: misafirken oynananlar hesaba taşınır.
    await push(userId, null, snapshot());
  }

  let last = snapshot();
  unsubscribe = useGameStore.subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const next = snapshot();
      const before = last;
      last = next;
      push(userId, before, next);
    }, PUSH_DELAY_MS);
  });
}

export function stopSync() {
  unsubscribe?.();
  unsubscribe = null;
  if (timer) clearTimeout(timer);
  timer = null;
  currentUser = null;
}
