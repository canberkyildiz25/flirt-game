import { ImageSourcePropType } from 'react-native';
import { Character } from '../types';
import { OCCUPATIONS } from './creatorOptions';

// scripts/generate-backgrounds.mjs ile üretilip kontrol edilmiş, insansız sohbet sahneleri.
// Listede olmayan karakterin sohbeti düz zeminde açılır.
const BY_CHARACTER: Record<string, ImageSourcePropType> = {
  '1': require('../../assets/backgrounds/1.jpg'),
  '2': require('../../assets/backgrounds/2.jpg'),
  '3': require('../../assets/backgrounds/3.jpg'),
  '4': require('../../assets/backgrounds/4.jpg'),
  '5': require('../../assets/backgrounds/5.jpg'),
  '6': require('../../assets/backgrounds/6.jpg'),
  '7': require('../../assets/backgrounds/7.jpg'),
  '8': require('../../assets/backgrounds/8.jpg'),
  '9': require('../../assets/backgrounds/9.jpg'),
  '10': require('../../assets/backgrounds/10.jpg'),
  '11': require('../../assets/backgrounds/11.jpg'),
  '12': require('../../assets/backgrounds/12.jpg'),
  '13': require('../../assets/backgrounds/13.jpg'),
  '14': require('../../assets/backgrounds/14.jpg'),
  '15': require('../../assets/backgrounds/15.jpg'),
  '16': require('../../assets/backgrounds/16.jpg'),
  '17': require('../../assets/backgrounds/17.jpg'),
  '18': require('../../assets/backgrounds/18.jpg'),
};

// Kullanıcının oluşturduğu karakterler mesleğine göre sahne alır.
const BY_JOB: Record<string, ImageSourcePropType> = {
  architect: require('../../assets/backgrounds/job-architect.jpg'),
  barista: require('../../assets/backgrounds/job-barista.jpg'),
  engineer: require('../../assets/backgrounds/job-engineer.jpg'),
  vet: require('../../assets/backgrounds/job-vet.jpg'),
  pilot: require('../../assets/backgrounds/job-pilot.jpg'),
  writer: require('../../assets/backgrounds/job-writer.jpg'),
  teacher: require('../../assets/backgrounds/job-teacher.jpg'),
  designer: require('../../assets/backgrounds/job-designer.jpg'),
  athlete: require('../../assets/backgrounds/job-athlete.jpg'),
  florist: require('../../assets/backgrounds/job-florist.jpg'),
};

// Kullanıcı karakterinde meslek Türkçe etiketiyle saklanır; etiketten sahne bulunur.
export function chatBackground(character: Character): ImageSourcePropType | undefined {
  if (BY_CHARACTER[character.id]) return BY_CHARACTER[character.id];
  const job = OCCUPATIONS.find((o) => o.label === character.occupation);
  return job ? BY_JOB[job.id] : undefined;
}
