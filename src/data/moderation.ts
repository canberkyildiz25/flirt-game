// Kullanıcının yazdığı ad ve tanıtım için kaba bir süzgeç. Görsel isteği zaten hazır listelerden
// kurulur; bu süzgeç profilde görünen ve sohbet modeline giden serbest metni korur.

// Kelimenin başında aranır (Türkçe ekler için): "sevişmek", "sevişelim" vb.
const ROOTS = [
  'mastürbasyon', 'masturbasyon', 'masturbation', 'seks', 'sex', 'sikiş', 'sikis', 'sikme', 'sikil', 'amcık', 'amcik',
  'yarrak', 'yarak', 'porno', 'porn', 'çıplak', 'ciplak', 'nude', 'naked', 'orgazm', 'orgasm', 'erotik', 'erotic',
  'fetiş', 'fetis', 'fetish', 'seviş', 'sevis', 'penis', 'vajina', 'vagina', 'boob', 'tits', 'horny', 'azgın', 'azgin',
  'striptiz', 'stripper', 'escort', 'fahişe', 'fahise', 'onlyfans', 'sakso', 'blowjob', 'kucak dans', 'lapdance',
  'pussy', 'dick', 'cock', 'cum', 'boşal', 'bosal', 'göğüslerini', 'memeler', 'iç çamaşır', 'ic camasir', 'lingerie',
  // Reşit olmayanlara gönderme
  'çocuk', 'cocuk', 'liseli', 'lise ', 'ortaokul', 'ergen', 'reşit', 'resit', 'minor', 'teen', 'loli', 'underage',
];

// Tam kelime olarak aranır; kök olarak aransa "analiz", "orale" gibi masum kelimeleri yakalardı.
const WORDS = ['anal', 'oral', 'sik', 'am', 'göt', 'got', 'meme', 'sexy', 'seksi', 'kid'];

const normalize = (text: string) =>
  ` ${text.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;

export function isInappropriate(text: string): boolean {
  const clean = normalize(text);
  if (/\b(1[0-7]|[1-9]) ?yaş/u.test(clean)) return true; // "15 yaşında", "16 yaş" gibi
  if (ROOTS.some((root) => clean.includes(` ${root}`))) return true;
  return WORDS.some((word) => clean.includes(` ${word} `));
}
