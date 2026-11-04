export type RelationshipStage =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'crush'
  | 'romantic'
  | 'lover';

export interface Character {
  id: string;
  name: string;
  age: number;
  occupation: string;
  personality: string;
  hobbies: string[];
  bio: string;
  color: string;
  affection: number; // 0-100
  stage: RelationshipStage;
  isUnlocked: boolean;
}

export interface StoredMessage {
  id: string;
  text: string;
  isPlayer: boolean;
  affectionChange?: number;
}

export interface Conversation {
  messages: StoredMessage[];
  history: { role: 'user' | 'assistant'; content: string }[]; // modele giden geçmiş
  updatedAt: number;
}

export type RootStackParamList = {
  Home: undefined;
  Characters: undefined;
  Conversations: undefined;
  Auth: { mode?: 'login' | 'signup' } | undefined;
  CharacterProfile: { characterId: string };
  Chat: { characterId: string };
};
