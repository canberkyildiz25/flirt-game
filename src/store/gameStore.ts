import { create } from 'zustand';
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

interface GameState {
  characters: Character[];
  activeCharacterId: string | null;
  chatHistory: Record<string, { message: string; isPlayer: boolean }[]>;
  setActiveCharacter: (id: string) => void;
  addAffection: (characterId: string, amount: number) => void;
  addChatMessage: (characterId: string, message: string, isPlayer: boolean) => void;
  unlockCharacter: (characterId: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  characters: CHARACTERS,
  activeCharacterId: null,
  chatHistory: {},

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
}));

export { STAGE_THRESHOLDS };
