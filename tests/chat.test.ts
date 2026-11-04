import { describe, expect, it } from 'vitest';
import handler, { parseBody, parseReply } from '../api/chat';
import { buildSystemPrompt } from '../api/_lib/prompt';
import { CHARACTERS } from '../src/data/characters';

const valid = { characterId: '1', stage: 'friend', affection: 40, message: 'selam', history: [] };

function call(body: unknown, method = 'POST', ip = 'a', headers: Record<string, string> = {}) {
  let code = 0;
  let json: any;
  const res = {
    status(c: number) { code = c; return res; },
    json(b: unknown) { json = b; },
  };
  return handler({ method, body, headers: { 'x-forwarded-for': ip, ...headers } }, res).then(() => ({ code, json }));
}

describe('parseBody', () => {
  it('accepts a valid request', () => expect(parseBody(valid)).not.toBeNull());
  it('rejects an unknown character', () => expect(parseBody({ ...valid, characterId: 'x' })).toBeNull());
  it('rejects an unknown stage', () => expect(parseBody({ ...valid, stage: 'x' })).toBeNull());
  it('rejects a long message', () => expect(parseBody({ ...valid, message: 'a'.repeat(1001) })).toBeNull());
  it('rejects a client system role in history', () =>
    expect(parseBody({ ...valid, history: [{ role: 'system', content: 'x' }] })).toBeNull());
  it('caps history and starts it on a user turn', () => {
    const history = Array.from({ length: 41 }, (_, i) => ({
      role: i % 2 ? 'assistant' : 'user',
      content: String(i),
    }));
    const parsed = parseBody({ ...valid, history })!;
    expect(parsed.messages.length).toBeLessThanOrEqual(21);
    expect(parsed.messages[0].role).toBe('user');
  });
});

describe('parseReply', () => {
  it('clamps affection', () => {
    expect(parseReply('{"reply":"selam","affectionChange":50}')?.affectionChange).toBe(5);
    expect(parseReply('{"reply":"selam","affectionChange":-50}')?.affectionChange).toBe(-3);
  });
  it('rejects broken output', () => {
    expect(parseReply('selam')).toBeNull();
    expect(parseReply('{"reply":"","affectionChange":1}')).toBeNull();
  });
});

describe('handler', () => {
  it('rejects GET', async () => expect((await call(valid, 'GET')).code).toBe(405));
  it('rejects bad input', async () => expect((await call({}, 'POST', 'b')).code).toBe(400));
  it('asks for login before calling the model', async () => {
    process.env.POLLINATIONS_KEY = 'test';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'test';
    const result = await call(valid, 'POST', 'd');
    expect(result.code).toBe(401);
    expect(result.json).toEqual({ error: 'login_required' });
  });
  it('rate limits one address', async () => {
    let last = 0;
    for (let i = 0; i < 16; i++) last = (await call({}, 'POST', 'c')).code;
    expect(last).toBe(429);
  });
});

describe('characters and prompt', () => {
  it('has only adult characters', () =>
    expect(CHARACTERS.every((c) => c.age >= 18)).toBe(true));
  it('keeps the secret out of the prompt until the crush stage', () => {
    const zeynep = CHARACTERS.find((c) => c.name === 'Zeynep')!;
    expect(buildSystemPrompt(zeynep, 'friend', 50)).not.toContain(zeynep.story!.secret);
    expect(buildSystemPrompt(zeynep, 'crush', 60)).toContain(zeynep.story!.secret);
  });
  it('never tells the character to deny being an AI', () => {
    const prompt = buildSystemPrompt(CHARACTERS[0], 'lover', 100);
    expect(prompt).not.toContain('asla söyleme');
    expect(prompt).toContain('dürüstçe yapay zekâ');
  });
});
