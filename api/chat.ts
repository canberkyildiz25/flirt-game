import { CHARACTERS } from '../src/data/characters';
import { buildSystemPrompt, STAGES } from './_lib/prompt';
import { admin, clientIp, currentUser, Req, Res, windowLimiter } from './_lib/auth';
import { characterFromRow } from './_lib/customCharacter';
import { Character, RelationshipStage } from '../src/types';

const POLLINATIONS_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const MODEL = process.env.CHAT_MODEL ?? 'openai/gpt-5.4-mini';
const MAX_HISTORY = 20;
const MAX_LENGTH = 1000;
const DAILY_LIMIT = Number(process.env.DAILY_MESSAGE_LIMIT ?? 100);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const limited = windowLimiter(15);

const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    affectionChange: { type: 'integer' },
  },
  required: ['reply', 'affectionChange'],
  additionalProperties: false,
};

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export function parseReply(raw: string) {
  try {
    // Bazı modeller JSON'u kod bloğuna sarar.
    const parsed = JSON.parse(raw.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ''));
    if (typeof parsed.reply !== 'string' || !parsed.reply.trim()) return null;
    const change = Math.round(Number(parsed.affectionChange)) || 0;
    return { reply: parsed.reply.trim(), affectionChange: Math.min(5, Math.max(-3, change)) };
  } catch {
    return null;
  }
}

// Hazır karakterler kimlikle, kullanıcının karakterleri UUID ile gelir (sahiplik girişten sonra kontrol edilir).
export function parseBody(body: any) {
  const characterId = body?.characterId;
  const builtIn = CHARACTERS.find((c) => c.id === characterId);
  const stage = body?.stage as RelationshipStage;
  const affection = Number(body?.affection);
  const message = body?.message;
  const history = body?.history ?? [];
  if (typeof characterId !== 'string' || (!builtIn && !UUID.test(characterId))) return null;
  if (!STAGES.includes(stage)) return null;
  if (!Number.isFinite(affection) || affection < 0 || affection > 100) return null;
  if (typeof message !== 'string' || !message.trim() || message.length > MAX_LENGTH) return null;
  if (!Array.isArray(history)) return null;
  const clean = history.slice(-MAX_HISTORY);
  const valid = clean.every(
    (m: any) =>
      (m?.role === 'user' || m?.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.length <= MAX_LENGTH
  );
  if (!valid) return null;
  // Konuşma kullanıcı mesajıyla başlamalı; kırpma asistanla başlatabilir.
  const start = clean.findIndex((m: any) => m.role === 'user');
  return {
    characterId,
    builtIn,
    stage,
    affection,
    messages: [
      ...(start === -1 ? [] : clean.slice(start)),
      { role: 'user' as const, content: message },
    ] as ChatMessage[],
  };
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (limited(clientIp(req))) return res.status(429).json({ error: 'rate_limited' });

  const input = parseBody(req.body);
  if (!input) return res.status(400).json({ error: 'invalid' });

  const db = admin();
  if (!process.env.POLLINATIONS_KEY || !db) return res.status(503).json({ error: 'not_configured' });
  const user = await currentUser(db, req);
  if (!user) return res.status(401).json({ error: 'login_required' });

  let character: Character | undefined = input.builtIn;
  if (!character) {
    const { data: row } = await db
      .from('custom_characters')
      .select('*')
      .eq('id', input.characterId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!row) return res.status(404).json({ error: 'unknown_character' });
    character = characterFromRow(row);
  }

  const { data: used, error: usageError } = await db.rpc('bump_message_usage', { p_user: user.id });
  if (usageError) {
    console.error('usage failed', usageError.code);
    return res.status(503).json({ error: 'not_configured' });
  }
  if (Number(used) > DAILY_LIMIT) return res.status(429).json({ error: 'daily_limit' });

  try {
    const response = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.POLLINATIONS_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        response_format: { type: 'json_schema', json_schema: { name: 'reply', strict: true, schema: REPLY_SCHEMA } },
        messages: [
          { role: 'system', content: buildSystemPrompt(character, input.stage, input.affection) },
          ...input.messages,
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (response.status === 429) return res.status(429).json({ error: 'rate_limited' });
    if (!response.ok) {
      console.error('chat failed', response.status);
      return res.status(502).json({ error: 'upstream' });
    }
    const data = await response.json();
    const parsed = parseReply(data?.choices?.[0]?.message?.content ?? '');
    if (!parsed) return res.status(502).json({ error: 'upstream' });
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('chat failed', error instanceof Error ? error.name : error);
    return res.status(502).json({ error: 'upstream' });
  }
}
