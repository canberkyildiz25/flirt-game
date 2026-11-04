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

export type RootStackParamList = {
  Home: undefined;
  Characters: undefined;
  CharacterProfile: { characterId: string };
  Chat: { characterId: string };
};
