import { createClient } from '@supabase/supabase-js';
import { CHARACTERS } from '../src/data/characters';
import { buildSystemPrompt, STAGES } from './_lib/prompt';
import { RelationshipStage } from '../src/types';

const POLLINATIONS_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const MODEL = process.env.CHAT_MODEL ?? 'openai/gpt-5.4-mini';
const MAX_HISTORY = 20;
const MAX_LENGTH = 1000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;
const DAILY_LIMIT = Number(process.env.DAILY_MESSAGE_LIMIT ?? 100);

// Gizli anahtar yalnızca sunucuda; token doğrulama ve günlük sayaç için.
function admin() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    affectionChange: { type: 'integer' },
  },
  required: ['reply', 'affectionChange'],
  additionalProperties: false,
};

// Örnek başına çalışır: tek başına bütçe koruması değildir, Pollinations tarafında bakiye de sınır koyar.
const hits = new Map<string, number[]>();

function isLimited(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

interface Req {
  method?: string;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
}

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

export function parseBody(body: any) {
  const character = CHARACTERS.find((c) => c.id === body?.characterId);
  const stage = body?.stage as RelationshipStage;
  const affection = Number(body?.affection);
  const message = body?.message;
  const history = body?.history ?? [];
  if (!character || !STAGES.includes(stage)) return null;
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
    character,
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

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0] ?? 'unknown';
  if (isLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const input = parseBody(req.body);
  if (!input) return res.status(400).json({ error: 'invalid' });
  const db = admin();
  if (!process.env.POLLINATIONS_KEY || !db) return res.status(503).json({ error: 'not_configured' });

  const auth = req.headers.authorization;
  const token = (Array.isArray(auth) ? auth[0] : auth)?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'login_required' });
  const { data: who } = await db.auth.getUser(token);
  if (!who.user) return res.status(401).json({ error: 'login_required' });

  const { data: used, error: usageError } = await db.rpc('bump_message_usage', { p_user: who.user.id });
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
          { role: 'system', content: buildSystemPrompt(input.character, input.stage, input.affection) },
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
