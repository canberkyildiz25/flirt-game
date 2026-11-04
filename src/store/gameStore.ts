import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character, Conversation, RelationshipStage } from '../types';
import { CHARACTERS } from '../data/characters';
import { characterFromRow, CustomRow } from '../data/customCharacters';

const STAGE_THRESHOLDS: Record<RelationshipStage, number> = {
  stranger: 0,
  acquaintance: 20,
  friend: 40,
  crush: 60,
  romantic: 80,
  lover: 100,
};

function getStageFromAffection(affection: number): RelationshipStage {
  if (affection >= 100) return 'lover';
  if (affection >= 80) return 'romantic';
  if (affection >= 60) return 'crush';
  if (affection >= 40) return 'friend';
  if (affection >= 20) return 'acquaintance';
  return 'stranger';
}

export interface GameSnapshot {
  characters: Character[];
  coins: number;
  lastRewardDate: string | null;
  conversations: Record<string, Conversation>;
}

interface ServerState {
  coins?: number;
  lastRewardDate?: string | null;
  custom: CustomRow[];
  progress: { character_id: string; affection: number; stage: string; is_unlocked: boolean }[];
  conversations: { character_id: string; messages: Conversation['messages']; history: Conversation['history']; updated_at: string }[];
}

// Kilitli karakterleri açmak için coin maliyeti
export const UNLOCK_COST = 80;
export const DAILY_REWARD = 30;

export const today = () => new Date().toISOString().slice(0, 10);

// Cihazda tutulan sohbet sınırı; modele zaten son 20 mesaj gider.
const MAX_STORED_MESSAGES = 200;
const MAX_STORED_HISTORY = 40;

interface GameState {
  characters: Character[];
  activeCharacterId: string | null;
  conversations: Record<string, Conversation>;
  coins: number;
  lastPlayedCharacterId: string | null;
  isAdultConfirmed: boolean;
  lastRewardDate: string | null;

  setActiveCharacter: (id: string) => void;
  addAffection: (characterId: string, amount: number) => void;
  saveConversation: (characterId: string, conversation: Omit<Conversation, 'updatedAt'>) => void;
  clearConversation: (characterId: string) => void;
  unlockCharacter: (characterId: string) => void;
  earnCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  setLastPlayed: (id: string) => void;
  confirmAdult: () => void;
  applyServerState: (server: ServerState) => void;
  resetProgress: () => void;
  addCustomCharacter: (character: Character) => void;
  claimDailyReward: () => boolean;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      characters: CHARACTERS,
      activeCharacterId: null,
      conversations: {},
      coins: 50, // başlangıç bonus'u
      lastPlayedCharacterId: null,
      isAdultConfirmed: false,
      lastRewardDate: null,

      setActiveCharacter: (id) => set({ activeCharacterId: id }),

      addAffection: (characterId, amount) =>
        set((state) => ({
          characters: state.characters.map((c) => {
            if (c.id !== characterId) return c;
            const newAffection = Math.min(100, Math.max(0, c.affection + amount));
            return {
              ...c,
              affection: newAffection,
              stage: getStageFromAffection(newAffection),
            };
          }),
        })),

      saveConversation: (characterId, { messages, history }) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [characterId]: {
              messages: messages.slice(-MAX_STORED_MESSAGES),
              history: history.slice(-MAX_STORED_HISTORY),
              updatedAt: Date.now(),
            },
          },
        })),

      clearConversation: (characterId) =>
        set((state) => {
          const { [characterId]: _removed, ...rest } = state.conversations;
          return { conversations: rest };
        }),

      unlockCharacter: (characterId) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === characterId ? { ...c, isUnlocked: true } : c
          ),
        })),

      earnCoins: (amount) =>
        set((state) => ({ coins: state.coins + amount })),

      spendCoins: (amount) => {
        const current = get().coins;
        if (current < amount) return false;
        set({ coins: current - amount });
        return true;
      },

      setLastPlayed: (id) => set({ lastPlayedCharacterId: id }),

      confirmAdult: () => set({ isAdultConfirmed: true }),

      // Hesaptaki kayıt cihazdakinin yerine geçer.
      applyServerState: ({ coins, lastRewardDate, custom, progress, conversations }) =>
        set((state) => ({
          coins: coins ?? state.coins,
          lastRewardDate: lastRewardDate ?? null,
          characters: [...CHARACTERS, ...custom.map(characterFromRow)].map((c) => {
            const row = progress.find((p) => p.character_id === c.id);
            return row
              ? { ...c, affection: row.affection, stage: getStageFromAffection(row.affection), isUnlocked: row.is_unlocked }
              : c;
          }),
          conversations: Object.fromEntries(
            conversations.map((row) => [
              row.character_id,
              { messages: row.messages, history: row.history, updatedAt: Date.parse(row.updated_at) },
            ])
          ),
        })),

      // Çıkışta cihazdaki ilerleme silinir; bir sonraki kişi görmesin.
      resetProgress: () =>
        set({ characters: CHARACTERS, coins: 50, conversations: {}, lastPlayedCharacterId: null, lastRewardDate: null }),

      addCustomCharacter: (character) =>
        set((state) => ({ characters: [...state.characters, character] })),

      claimDailyReward: () => {
        if (get().lastRewardDate === today()) return false;
        set((state) => ({ coins: state.coins + DAILY_REWARD, lastRewardDate: today() }));
        return true;
      },
    }),
    {
      name: 'flirt-game-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Kayıttan yalnızca ilerleme alınır; hazır karakterlerin metni ve etiketleri her açılışta güncel
      // veriden gelir. Kullanıcının oluşturduğu karakterler olduğu gibi kalır.
      merge: (persisted: any, current: GameState) => {
        const saved = new Map<string, Character>(
          (persisted?.characters ?? []).map((c: Character) => [c.id, c])
        );
        const builtIn = CHARACTERS.map((c) => {
          const old = saved.get(c.id);
          return old ? { ...c, affection: old.affection, stage: old.stage, isUnlocked: old.isUnlocked } : c;
        });
        const custom = (persisted?.characters ?? []).filter((c: Character) => c.isCustom);
        return {
          ...current,
          ...persisted,
          characters: [...builtIn, ...custom],
        };
      },
    }
  )
);

export { STAGE_THRESHOLDS };
