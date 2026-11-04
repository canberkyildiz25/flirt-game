import Anthropic from '@anthropic-ai/sdk';
import { CHARACTERS } from '../src/data/characters';
import { buildSystemPrompt, STAGES } from './_lib/prompt';
import { RelationshipStage } from '../src/types';

const MAX_HISTORY = 20;
const MAX_LENGTH = 1000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;

const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    affectionChange: { type: 'integer' },
  },
  required: ['reply', 'affectionChange'],
  additionalProperties: false,
};

// Örnek başına çalışır: tek başına bütçe koruması değildir, Anthropic tarafında harcama limiti de gerekir.
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

export function parseReply(raw: string) {
  try {
    const parsed = JSON.parse(raw);
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
  // API ilk mesajın kullanıcıdan gelmesini ister; kırpma asistanla başlatabilir.
  const start = clean.findIndex((m: any) => m.role === 'user');
  return {
    character,
    stage,
    affection,
    messages: [
      ...(start === -1 ? [] : clean.slice(start)),
      { role: 'user' as const, content: message },
    ] as Anthropic.MessageParam[],
  };
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0] ?? 'unknown';
  if (isLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

  const input = parseBody(req.body);
  if (!input) return res.status(400).json({ error: 'invalid' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'not_configured' });

  try {
    const response = await new Anthropic().beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: REPLY_SCHEMA } },
      system: buildSystemPrompt(input.character, input.stage, input.affection),
      messages: input.messages,
    } as any) as Anthropic.Beta.BetaMessage;
    if (response.stop_reason === 'refusal') return res.status(200).json({ reply: null, affectionChange: 0 });
    const raw = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');
    const parsed = parseReply(raw);
    if (!parsed) return res.status(502).json({ error: 'upstream' });
    return res.status(200).json(parsed);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'rate_limited' });
    console.error('chat failed', error instanceof Anthropic.APIError ? error.status : error);
    return res.status(502).json({ error: 'upstream' });
  }
}
