// Sohbet arka planlarını assets/backgrounds altına üretir: her karakter için bir sahne,
// kullanıcı karakterleri için de meslek başına bir sahne. Sahnelerde insan yoktur.
// Kullanım: node scripts/generate-backgrounds.mjs [ad ...]   Anahtar .env.local içindeki POLLINATIONS_KEY'den okunur.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('../assets/backgrounds/', import.meta.url);
const MODEL = process.env.MODEL ?? 'black-forest-labs/flux.1.1-pro';
const envFile = new URL('../.env.local', import.meta.url);
const KEY =
  process.env.POLLINATIONS_KEY ??
  (existsSync(envFile) ? readFileSync(envFile, 'utf8').match(/^POLLINATIONS_KEY=(.+)$/m)?.[1].trim() : undefined);
if (!KEY) throw new Error('POLLINATIONS_KEY eksik: .env.local dosyasına ekle');

const BASE =
  'cinematic photograph of an empty place, no people, no person, no text, no logo, no watermark, ' +
  'soft focus, moody evening light, rich color';

const SCENES = {
  1: 'painter studio with easels, paint splatters and a warm desk lamp',
  2: 'hospital staff break room at night with a coffee machine and city lights in the window',
  3: 'backstage of a small concert stage with a guitar on a stand and string lights',
  4: 'photo darkroom with a red safelight and prints drying on a line',
  5: 'university library reading room at dusk with green desk lamps',
  6: 'law office at night with tall bookshelves, a desk lamp and a city skyline',
  7: 'seaside terrace with plants at golden hour',
  8: 'empty dance studio with a wooden floor, mirrors and warm light',
  9: 'calm yoga studio with plants and candles in the evening',
  10: 'empty theatre stage with red curtains and a single spotlight',
  11: 'fashion atelier with mannequins and rolls of fabric in evening light',
  12: 'restaurant kitchen after hours with copper pans and warm light',
  13: 'airport terminal at night with planes outside the big windows',
  14: 'cozy coffee shop at night with vinyl records and a turntable',
  15: 'countryside stable at sunset with hay bales',
  16: 'mountain hut at dusk with snowy peaks and warm window light',
  17: 'rooftop cocktail bar at night with city lights bokeh',
  18: 'indie game studio desk at night with monitors and neon light',
  'job-architect': 'architecture studio with a drafting table and scale models',
  'job-barista': 'small coffee bar with an espresso machine in the morning light',
  'job-engineer': 'home office desk with two monitors glowing at night',
  'job-vet': 'clean veterinary clinic room with plants and soft daylight',
  'job-pilot': 'view from an airplane cockpit above the clouds at sunset',
  'job-writer': 'writer desk with a typewriter, books and a window with rain',
  'job-teacher': 'empty classroom in the evening with a chalkboard',
  'job-designer': 'design studio with posters on the wall and a large desk',
  'job-athlete': 'empty indoor volleyball court with dramatic lights',
  'job-florist': 'flower shop full of bouquets in warm light',
};

mkdirSync(OUT, { recursive: true });
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);

for (const name of names) {
  const prompt = encodeURIComponent(`${BASE}, ${SCENES[name]}`);
  const query = new URLSearchParams({ model: MODEL, width: '1024', height: '1024', seed: String(2000 + names.indexOf(name)) });
  const url = `https://gen.pollinations.ai/image/${prompt}?${query}`;
  let done = false;
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(180_000) }).catch((e) => ({ ok: false, status: e.name }));
    if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
      const bytes = Buffer.from(await res.arrayBuffer());
      writeFileSync(new URL(`${name}.jpg`, OUT), bytes);
      console.log(name, 'ok', bytes.length);
      done = true;
    } else {
      console.log(name, 'attempt', attempt, res.status);
      if (res.status === 402 || res.status === 401) process.exit(1);
      await new Promise((r) => setTimeout(r, 15_000));
    }
  }
}
