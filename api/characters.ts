import { randomUUID } from 'node:crypto';
import { admin, clientIp, currentUser, Req, Res, windowLimiter } from './_lib/auth';
import { parseCreator, portraitPrompt, rowFromInput } from './_lib/customCharacter';
import { PORTRAIT_BASE } from '../src/data/creatorOptions';

const MODEL = process.env.PORTRAIT_MODEL ?? 'black-forest-labs/flux.1.1-pro';
const DAILY_LIMIT = Number(process.env.DAILY_PORTRAIT_LIMIT ?? 3);
const limited = windowLimiter(5);

// Kullanıcının karakterini oluşturur: portreyi üretir, depoya yükler, kaydı yazar.
export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (limited(clientIp(req))) return res.status(429).json({ error: 'rate_limited' });

  const input = parseCreator(req.body);
  if (!input) return res.status(400).json({ error: 'invalid' });

  const db = admin();
  if (!process.env.POLLINATIONS_KEY || !db) return res.status(503).json({ error: 'not_configured' });
  const user = await currentUser(db, req);
  if (!user) return res.status(401).json({ error: 'login_required' });

  const { data: used, error: usageError } = await db.rpc('bump_portrait_usage', { p_user: user.id });
  if (usageError) {
    console.error('portrait usage failed', usageError.code);
    return res.status(503).json({ error: 'not_configured' });
  }
  if (Number(used) > DAILY_LIMIT) return res.status(429).json({ error: 'daily_limit' });

  const id = randomUUID();
  const seed = parseInt(id.slice(0, 6), 16);
  const query = new URLSearchParams({ model: MODEL, width: '832', height: '1024', seed: String(seed) });
  const prompt = encodeURIComponent(`${PORTRAIT_BASE}, ${portraitPrompt(input)}`);

  try {
    const image = await fetch(`https://gen.pollinations.ai/image/${prompt}?${query}`, {
      headers: { Authorization: `Bearer ${process.env.POLLINATIONS_KEY}` },
      signal: AbortSignal.timeout(50_000),
    });
    if (image.status === 422) return res.status(422).json({ error: 'portrait_rejected' });
    if (!image.ok || !image.headers.get('content-type')?.startsWith('image/')) {
      console.error('portrait failed', image.status);
      return res.status(502).json({ error: 'upstream' });
    }
    const bytes = Buffer.from(await image.arrayBuffer());
    const path = `${user.id}/${id}.jpg`;
    const upload = await db.storage.from('portraits').upload(path, bytes, { contentType: 'image/jpeg' });
    if (upload.error) {
      console.error('upload failed', upload.error.message);
      return res.status(502).json({ error: 'upstream' });
    }
    const portraitUrl = db.storage.from('portraits').getPublicUrl(path).data.publicUrl;

    const { data: row, error } = await db
      .from('custom_characters')
      .insert({ id, user_id: user.id, ...rowFromInput(input, seed), portrait_url: portraitUrl })
      .select()
      .single();
    if (error) {
      console.error('insert failed', error.code);
      return res.status(502).json({ error: 'upstream' });
    }
    return res.status(200).json({ character: row });
  } catch (error) {
    console.error('portrait failed', error instanceof Error ? error.name : error);
    return res.status(502).json({ error: 'upstream' });
  }
}
