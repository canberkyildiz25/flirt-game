import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character, RelationshipStage } from '../types';
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

interface GameState {
  characters: Character[];
  activeCharacterId: string | null;
  chatHistory: Record<string, { message: string; isPlayer: boolean }[]>;
  coins: number;
  lastPlayedCharacterId: string | null;

  setActiveCharacter: (id: string) => void;
  addAffection: (characterId: string, amount: number) => void;
  addChatMessage: (characterId: string, message: string, isPlayer: boolean) => void;
  unlockCharacter: (characterId: string) => void;
  earnCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  setLastPlayed: (id: string) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      characters: CHARACTERS,
      activeCharacterId: null,
      chatHistory: {},
      coins: 50, // başlangıç bonus'u
      lastPlayedCharacterId: null,

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

      addChatMessage: (characterId, message, isPlayer) =>
        set((state) => ({
          chatHistory: {
            ...state.chatHistory,
            [characterId]: [
              ...(state.chatHistory[characterId] || []),
              { message, isPlayer },
            ],
          },
        })),

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
