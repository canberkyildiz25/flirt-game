import { ImageSourcePropType } from 'react-native';
import { Character } from '../types';
import { OCCUPATIONS } from './creatorOptions';

// scripts/generate-backgrounds.mjs ile üretilip kontrol edilmiş, insansız sohbet sahneleri.
// Listede olmayan karakterin sohbeti düz zeminde açılır.
const BY_CHARACTER: Record<string, ImageSourcePropType> = {
  '1': require('../../assets/backgrounds/1.jpg'),
  '2': require('../../assets/backgrounds/2.jpg'),
  '3': require('../../assets/backgrounds/3.jpg'),
  '5': require('../../assets/backgrounds/5.jpg'),
  '6': require('../../assets/backgrounds/6.jpg'),
};

// Meslek sahneleri bakiye yenilenince üretilecek.
const BY_JOB: Record<string, ImageSourcePropType> = {};

// Kullanıcı karakterinde meslek Türkçe etiketiyle saklanır; etiketten sahne bulunur.
export function chatBackground(character: Character): ImageSourcePropType | undefined {
  if (BY_CHARACTER[character.id]) return BY_CHARACTER[character.id];
  const job = OCCUPATIONS.find((o) => o.label === character.occupation);
  return job ? BY_JOB[job.id] : undefined;
}
