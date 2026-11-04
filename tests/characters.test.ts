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
  look: { hairColor: 'brown', hairStyle: 'waves', outfit: 'cozy' },
};

describe('parseCreator', () => {
  it('accepts a complete character', () => expect(parseCreator(valid)).not.toBeNull());
  it('refuses anyone under 18', () => expect(parseCreator({ ...valid, age: 17 })).toBeNull());
  it('refuses options outside the list', () =>
    expect(parseCreator({ ...valid, look: { ...valid.look, outfit: 'lingerie' } })).toBeNull());
  it('refuses more than three personalities', () =>
    expect(parseCreator({ ...valid, personalities: ['warm', 'witty', 'shy', 'bold'] })).toBeNull());
  it('refuses names with symbols or links', () => {
    expect(parseCreator({ ...valid, name: 'http://x.co' })).toBeNull();
    expect(parseCreator({ ...valid, name: 'a'.repeat(21) })).toBeNull();
  });
  it('builds the image prompt only from listed options', () => {
    const prompt = portraitPrompt(parseCreator({ ...valid, bio: 'nude' })!);
    expect(prompt).not.toContain('nude');
    expect(prompt).toContain('chunky turtleneck knit');
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
