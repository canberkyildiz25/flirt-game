import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character, Conversation, RelationshipStage } from '../types';
import { CHARACTERS } from '../data/characters';

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

// Kilitli karakterleri açmak için coin maliyeti
export const UNLOCK_COST = 80;

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

  setActiveCharacter: (id: string) => void;
  addAffection: (characterId: string, amount: number) => void;
  saveConversation: (characterId: string, conversation: Omit<Conversation, 'updatedAt'>) => void;
  clearConversation: (characterId: string) => void;
  unlockCharacter: (characterId: string) => void;
  earnCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  setLastPlayed: (id: string) => void;
  confirmAdult: () => void;
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
    }),
    {
      name: 'flirt-game-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Yeni eklenen karakterleri persist edilmiş state'e merge et
      merge: (persisted: any, current: GameState) => {
        const persistedIds = new Set<string>(
          persisted.characters?.map((c: Character) => c.id) ?? []
        );
        const newChars = CHARACTERS.filter((c) => !persistedIds.has(c.id));
        return {
          ...current,
          ...persisted,
          characters: [...(persisted.characters ?? []), ...newChars],
        };
      },
    }
  )
);

export { STAGE_THRESHOLDS };
