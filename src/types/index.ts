export type RelationshipStage =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'crush'
  | 'romantic'
  | 'lover';

export interface DialogueOption {
  id: string;
  text: string;
  affectionChange: number;
  nextDialogueId: string | null;
  response: string;
}

export interface Dialogue {
  id: string;
  characterId: string;
  message: string;
  options: DialogueOption[];
  stage: RelationshipStage;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  occupation: string;
  personality: string;
  hobbies: string[];
  bio: string;
  avatar: string;
  stageAvatars?: Partial<Record<RelationshipStage, string>>; // ilişki ilerledikçe değişen fotoğraf
  color: string;
  affection: number; // 0-100
  stage: RelationshipStage;
  isUnlocked: boolean;
  dialogues: Dialogue[];
}

export type RootStackParamList = {
  Home: undefined;
  Characters: undefined;
  CharacterProfile: { characterId: string };
  Chat: { characterId: string };
};
