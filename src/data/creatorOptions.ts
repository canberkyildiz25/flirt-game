// Karakter oluşturma seçenekleri. İstemci ve sunucu aynı listeyi kullanır;
// görsel isteği yalnızca buradaki İngilizce parçalardan kurulur, serbest metin girmez.

export interface Option {
  id: string;
  label: string;
  prompt?: string;
}

export const OCCUPATIONS: Option[] = [
  { id: 'architect', label: 'Mimar' },
  { id: 'barista', label: 'Barista' },
  { id: 'engineer', label: 'Yazılımcı' },
  { id: 'vet', label: 'Veteriner' },
  { id: 'pilot', label: 'Pilot' },
  { id: 'writer', label: 'Yazar' },
  { id: 'teacher', label: 'Öğretmen' },
  { id: 'designer', label: 'Grafik tasarımcı' },
  { id: 'athlete', label: 'Voleybolcu' },
  { id: 'florist', label: 'Çiçekçi' },
];

export const PERSONALITIES: Option[] = [
  { id: 'warm', label: 'Sıcakkanlı' },
  { id: 'witty', label: 'Esprili' },
  { id: 'shy', label: 'Çekingen' },
  { id: 'bold', label: 'Cesur' },
  { id: 'calm', label: 'Sakin' },
  { id: 'curious', label: 'Meraklı' },
  { id: 'romantic', label: 'Romantik' },
  { id: 'sarcastic', label: 'İğneleyici' },
];

export const HOBBIES: Option[] = [
  { id: 'books', label: 'Kitap' },
  { id: 'hiking', label: 'Doğa yürüyüşü' },
  { id: 'cooking', label: 'Yemek yapmak' },
  { id: 'games', label: 'Video oyunları' },
  { id: 'music', label: 'Konserler' },
  { id: 'travel', label: 'Seyahat' },
  { id: 'cinema', label: 'Sinema' },
  { id: 'dance', label: 'Dans' },
];

export const SPEAKING_STYLES: Option[] = [
  { id: 'playful', label: 'Şakacı ve emojili' },
  { id: 'poetic', label: 'Şiirsel ve uzun' },
  { id: 'direct', label: 'Kısa ve net' },
  { id: 'teasing', label: 'Takılmayı seven' },
];

export const HAIR_COLORS: Option[] = [
  { id: 'black', label: 'Siyah', prompt: 'black hair' },
  { id: 'brown', label: 'Kahverengi', prompt: 'brown hair' },
  { id: 'blonde', label: 'Sarı', prompt: 'honey blonde hair' },
  { id: 'red', label: 'Kızıl', prompt: 'copper red hair' },
  { id: 'auburn', label: 'Kestane', prompt: 'auburn hair' },
  { id: 'pink', label: 'Pembe boyalı', prompt: 'pastel pink dyed hair' },
];

export const HAIR_STYLES: Option[] = [
  { id: 'long', label: 'Uzun düz', prompt: 'long straight hair' },
  { id: 'waves', label: 'Uzun dalgalı', prompt: 'long wavy hair' },
  { id: 'curls', label: 'Kıvırcık', prompt: 'voluminous curly hair' },
  { id: 'bob', label: 'Küt', prompt: 'chin length bob haircut' },
  { id: 'pixie', label: 'Kısa', prompt: 'short pixie haircut' },
  { id: 'bun', label: 'Topuz', prompt: 'hair in a neat bun' },
];

export const OUTFITS: Option[] = [
  { id: 'casual', label: 'Günlük', prompt: 'casual crew neck sweater' },
  { id: 'elegant', label: 'Şık', prompt: 'elegant high neck blouse' },
  { id: 'sporty', label: 'Sportif', prompt: 'zipped track jacket' },
  { id: 'artsy', label: 'Sanatsal', prompt: 'oversized denim shirt buttoned up and a scarf' },
  { id: 'business', label: 'İş', prompt: 'tailored blazer over a buttoned shirt' },
  { id: 'cozy', label: 'Rahat', prompt: 'chunky turtleneck knit' },
];

export const COLORS = ['#E91E8C', '#9C27B0', '#00BCD4', '#4CAF50', '#FF7043', '#7E57C2', '#EC407A', '#26A69A'];

export const PORTRAIT_BASE =
  'realistic editorial head and shoulders portrait photograph of a fictional adult woman in her late twenties, ' +
  'mature adult facial features, fully clothed, modest high neckline, natural skin texture, soft natural light, ' +
  '85mm lens, no text, no logo, no watermark, no brand';

export const find = (list: Option[], id: unknown) => list.find((o) => o.id === id);
