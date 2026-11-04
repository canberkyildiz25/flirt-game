// Kurgusal karakter portrelerini assets/portraits altına üretir.
// Kullanım: node scripts/generate-portraits.mjs [id ...]   Yeniden denemek için: SEED_OFFSET=1
// Anahtar .env.local içindeki POLLINATIONS_KEY'den okunur (sk_ ile başlayan gizli anahtar).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('../assets/portraits/', import.meta.url);
const OFFSET = Number(process.env.SEED_OFFSET ?? 0);
const MODEL = process.env.MODEL ?? 'black-forest-labs/flux.1.1-pro';

const envFile = new URL('../.env.local', import.meta.url);
const KEY =
  process.env.POLLINATIONS_KEY ??
  (existsSync(envFile) ? readFileSync(envFile, 'utf8').match(/^POLLINATIONS_KEY=(.+)$/m)?.[1].trim() : undefined);
if (!KEY) throw new Error('POLLINATIONS_KEY eksik: .env.local dosyasına ekle');

const BASE =
  'realistic editorial head and shoulders portrait photograph of a fictional adult woman in her late twenties, ' +
  'mature adult facial features, fully clothed, natural skin texture, soft natural light, 85mm lens, ' +
  'no text, no logo, no watermark, no brand';

const LOOKS = {
  13: 'short dark hair, pilot uniform with a white shirt buttoned to the collar under a navy jacket with epaulettes, airport terminal window background',
  14: 'messy blonde bun, light freckles, oversized black hoodie under a barista apron, cozy coffee shop with vinyl records background',
  15: 'long auburn braid, olive green high neck fleece jacket zipped up, stable with horses softly blurred background',
  16: 'dark hair under a knitted beanie, red mountain shell jacket zipped to the chin, snowy mountain peaks background',
  17: 'sleek black hair in a low ponytail, black high neck turtleneck sweater under a closed black blazer, moody rooftop bar lights background',
  18: 'woman about 29 years old with mature adult features and defined jawline, shoulder length black hair, rectangular glasses, charcoal blazer over a grey crew neck sweater, office desk with monitors background',
  1: 'bob haircut, dark hair, red beret, cream linen work shirt with paint marks, art studio background',
  2: 'auburn hair in a low bun, glasses, white doctor coat over teal scrubs, stethoscope, hospital corridor background',
  3: 'big curly copper hair, hoop earrings, navy jacket, guitar strap on shoulder, concert stage lights background',
  4: 'black asymmetric hair, olive skin, grey turtleneck, leather camera strap, city street at dusk background',
  5: 'two long brown braids, light freckles, green sweatshirt, university library background',
  6: 'sleek straight dark hair, tailored navy blazer, white shirt, law office with bookshelves background',
  7: 'long wavy honey blonde hair, sunglasses on head, orange high neck ribbed knit top covering the neck, sunny terrace background',
  8: 'long dark wavy hair with a pink flower, deep red ruffled high neck blouse, warm dance studio background',
  9: 'dark hair in a top knot, tan skin, lilac crew neck knit sweater, small crescent moon pendant over the sweater, calm forest background',
  10: 'short red pixie hair, sharp eyeliner, black costume with white ruffled collar, theatre curtains background',
  11: 'sharp platinum bob, high collar purple structured jacket, plain yellow measuring tape without markings around neck, fashion atelier background',
  12: 'dark hair in a ponytail, red bandana, white chef jacket with two rows of buttons, restaurant kitchen background',
};

mkdirSync(OUT, { recursive: true });
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LOOKS);

for (const id of ids) {
  const prompt = encodeURIComponent(`${BASE}, ${LOOKS[id]}`);
  const query = new URLSearchParams({ model: MODEL, width: '832', height: '1024', seed: String(1000 + Number(id) + OFFSET) });
  const url = `https://gen.pollinations.ai/image/${prompt}?${query}`;
  let done = false;
  for (let attempt = 1; attempt <= 4 && !done; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(180_000) }).catch((e) => ({ ok: false, status: e.name }));
    if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
      const bytes = Buffer.from(await res.arrayBuffer());
      writeFileSync(new URL(`${id}.jpg`, OUT), bytes);
      console.log(id, 'ok', bytes.length);
      done = true;
    } else {
      console.log(id, 'attempt', attempt, res.status);
      // 402 bakiye yok demek; yeniden denemek işe yaramaz.
      if (res.status === 402 || res.status === 401) process.exit(1);
      await new Promise((r) => setTimeout(r, 20_000));
    }
  }
}
