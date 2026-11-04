import { describe, expect, it } from 'vitest';
import handler from '../api/characters';
import { parseCreator, portraitPrompt } from '../api/_lib/customCharacter';
import { parseBody } from '../api/chat';

const valid = {
  name: 'Defne',
  age: 27,
  occupation: 'architect',
  personalities: ['warm', 'witty'],
  hobbies: ['books'],
  speakingStyle: 'playful',
  bio: 'Kadıköy’de yaşıyor.',
  look: { hairColor: 'brown', hairStyle: 'waves', outfit: 'cozy', eyeColor: 'hazel', complexion: 'olive' },
};

describe('parseCreator', () => {
  it('accepts a complete character', () => expect(parseCreator(valid)).not.toBeNull());
  it('refuses anyone under 18', () => expect(parseCreator({ ...valid, age: 17 })).toBeNull());
  it('puts eye colour and complexion into the image prompt', () => {
    const prompt = portraitPrompt(parseCreator(valid) as any);
    expect(prompt).toContain('hazel eyes');
    expect(prompt).toContain('olive complexion');
  });
  it('still accepts older requests without eye colour', () => {
    expect(parseCreator({ ...valid, look: { hairColor: 'brown', hairStyle: 'waves', outfit: 'cozy' } })).not.toBeNull();
  });
  it('refuses options outside the list', () =>
    expect(parseCreator({ ...valid, look: { ...valid.look, outfit: 'lingerie' } })).toBeNull());
  it('refuses more than three personalities', () =>
    expect(parseCreator({ ...valid, personalities: ['warm', 'witty', 'shy', 'bold'] })).toBeNull());
  it('refuses names with symbols or links', () => {
    expect(parseCreator({ ...valid, name: 'http://x.co' })).toBeNull();
    expect(parseCreator({ ...valid, name: 'a'.repeat(21) })).toBeNull();
  });
  it('refuses sexual or underage free text', () => {
    expect(parseCreator({ ...valid, bio: 'Mastürbasyon yapmayı seviyor.' })).toBe('inappropriate');
    expect(parseCreator({ ...valid, bio: 'Liseli bir kız, 16 yaşında.' })).toBe('inappropriate');
    expect(parseCreator({ ...valid, name: 'Seksi Defne' })).toBe('inappropriate');
  });
  it('keeps ordinary words that only look similar', () => {
    expect(parseCreator({ ...valid, bio: 'Analiz yapmayı ve klasik müziği sever, sıkıntıda sakin kalır.' })).not.toBe('inappropriate');
  });
  it('keeps the portrait clearly adult whatever age was picked', async () => {
    expect(portraitPrompt(parseCreator({ ...valid, age: 18 }) as any)).toContain('25 year old female architect');
    expect(portraitPrompt(parseCreator({ ...valid, age: 31 }) as any)).toContain('31 year old');
  });
  it('builds the image prompt only from listed options', () => {
    const prompt = portraitPrompt(parseCreator({ ...valid, bio: 'Kahve sever.' }) as any);
    expect(prompt).toContain('chunky turtleneck knit');
  });
  it('hides an inappropriate bio saved before the filter', async () => {
    const { characterFromRow } = await import('../src/data/customCharacters');
    const character = characterFromRow({
      id: 'x', name: 'Aslı', age: 18, occupation: 'Voleybolcu', personality: 'Çekingen', hobbies: [],
      speaking_style: 'Kısa ve net', bio: 'Mastürbasyon yapmayı seviyor.', look: valid.look, color: '#000', portrait_url: '',
    });
    expect(character.bio).not.toMatch(/mastürbasyon/i);
  });
});

describe('characters handler', () => {
  it('asks for login before generating', async () => {
    process.env.POLLINATIONS_KEY = 'test';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'test';
    let code = 0;
    const res = { status(c: number) { code = c; return res; }, json() {} };
    await handler({ method: 'POST', body: valid, headers: { 'x-forwarded-for': 'e' } }, res);
    expect(code).toBe(401);
  });
});

describe('chat accepts custom characters', () => {
  const body = { stage: 'stranger', affection: 0, message: 'selam', history: [] };
  it('takes a UUID for a user character', () =>
    expect(parseBody({ ...body, characterId: '3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b' })).not.toBeNull());
  it('still rejects other ids', () => expect(parseBody({ ...body, characterId: '../profiles' })).toBeNull());
});
