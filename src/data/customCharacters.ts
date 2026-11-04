import { Character } from '../types';
import { isInappropriate } from './moderation';

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
    name: isInappropriate(row.name) ? 'Adsız' : row.name,
    age: row.age,
    occupation: row.occupation,
    personality: row.personality,
    hobbies: row.hobbies,
    // Süzgeçten önce kaydedilmiş uygunsuz bir tanıtım ne gösterilir ne modele gider.
    bio: [isInappropriate(row.bio) ? '' : row.bio, `Konuşma tarzı: ${row.speaking_style}.`].filter(Boolean).join(' '),
    color: row.color,
    affection: 0,
    stage: 'stranger',
    isUnlocked: true,
    isCustom: true,
    portraitUrl: row.portrait_url,
  };
}
