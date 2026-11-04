import { Character } from '../types';

// custom_characters tablosundaki satır.
export interface CustomRow {
  id: string;
  name: string;
  age: number;
  occupation: string;
  personality: string;
  hobbies: string[];
  speaking_style: string;
  bio: string;
  look: { hairColor: string; hairStyle: string; outfit: string };
  color: string;
  portrait_url: string;
}

export function characterFromRow(row: CustomRow): Character {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    occupation: row.occupation,
    personality: row.personality,
    hobbies: row.hobbies,
    bio: [row.bio, `Konuşma tarzı: ${row.speaking_style}.`].filter(Boolean).join(' '),
    color: row.color,
    affection: 0,
    stage: 'stranger',
    isUnlocked: true,
    isCustom: true,
    portraitUrl: row.portrait_url,
  };
}
