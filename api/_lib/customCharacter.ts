export { characterFromRow } from '../../src/data/customCharacters';
import {
  find, HAIR_COLORS, HAIR_STYLES, HOBBIES, OCCUPATIONS, OUTFITS, PERSONALITIES, SPEAKING_STYLES, COLORS,
} from '../../src/data/creatorOptions';

export interface CreatorInput {
  name: string;
  age: number;
  occupation: string;
  personalities: string[];
  hobbies: string[];
  speakingStyle: string;
  bio: string;
  look: { hairColor: string; hairStyle: string; outfit: string };
}

const ids = (list: { id: string }[], value: unknown, max: number) =>
  Array.isArray(value) && value.length >= 1 && value.length <= max && value.every((v) => find(list as any, v))
    ? (value as string[])
    : null;

// Her alan hazır listeden gelmeli; yalnızca ad ve kısa tanıtım serbest metindir.
export function parseCreator(body: any): CreatorInput | null {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const age = Number(body?.age);
  const bio = typeof body?.bio === 'string' ? body.bio.trim() : '';
  const personalities = ids(PERSONALITIES, body?.personalities, 3);
  const hobbies = ids(HOBBIES, body?.hobbies, 3);
  const look = body?.look ?? {};
  if (!name || name.length > 20 || !/^[\p{L} '-]+$/u.test(name)) return null;
  if (!Number.isInteger(age) || age < 18 || age > 45) return null;
  if (bio.length > 240) return null;
  if (!find(OCCUPATIONS, body?.occupation) || !find(SPEAKING_STYLES, body?.speakingStyle)) return null;
  if (!personalities || !hobbies) return null;
  if (!find(HAIR_COLORS, look.hairColor) || !find(HAIR_STYLES, look.hairStyle) || !find(OUTFITS, look.outfit)) return null;
  return {
    name,
    age,
    occupation: body.occupation,
    personalities,
    hobbies,
    speakingStyle: body.speakingStyle,
    bio,
    look: { hairColor: look.hairColor, hairStyle: look.hairStyle, outfit: look.outfit },
  };
}

export function portraitPrompt(input: CreatorInput): string {
  const parts = [
    find(HAIR_COLORS, input.look.hairColor)!.prompt,
    find(HAIR_STYLES, input.look.hairStyle)!.prompt,
    find(OUTFITS, input.look.outfit)!.prompt,
    'softly blurred neutral background',
  ];
  return parts.join(', ');
}

export function rowFromInput(input: CreatorInput, seed: number) {
  return {
    name: input.name,
    age: input.age,
    occupation: find(OCCUPATIONS, input.occupation)!.label,
    personality: input.personalities.map((p) => find(PERSONALITIES, p)!.label).join(', '),
    hobbies: input.hobbies.map((h) => find(HOBBIES, h)!.label),
    speaking_style: find(SPEAKING_STYLES, input.speakingStyle)!.label,
    bio: input.bio,
    look: input.look,
    color: COLORS[seed % COLORS.length],
  };
}
