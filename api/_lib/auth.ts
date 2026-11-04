import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export interface Req {
  method?: string;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
}
export interface Res {
  status(code: number): Res;
  json(body: unknown): void;
}

// Gizli anahtar yalnızca sunucuda; token doğrulama ve sayaçlar için.
export function admin(): SupabaseClient | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export async function currentUser(db: SupabaseClient, req: Req): Promise<User | null> {
  const auth = req.headers.authorization;
  const token = (Array.isArray(auth) ? auth[0] : auth)?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await db.auth.getUser(token);
  return data.user ?? null;
}

export function clientIp(req: Req): string {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0] ?? 'unknown';
}

// Örnek başına çalışan kısa süreli sınır; asıl sınır veritabanındaki günlük sayaçtır.
export function windowLimiter(max: number, windowMs = 60_000) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > max;
  };
}
