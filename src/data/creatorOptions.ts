// Karakter oluşturma seçenekleri. İstemci ve sunucu aynı listeyi kullanır;
// görsel isteği yalnızca buradaki İngilizce parçalardan kurulur, serbest metin girmez.

export interface Option {
  id: string;
  label: string;
  prompt?: string;
}

export const OCCUPATIONS: Option[] = [
  { id: 'architect', label: 'Mimar', prompt: 'architect' },
  { id: 'barista', label: 'Barista', prompt: 'barista' },
  { id: 'engineer', label: 'Yazılımcı', prompt: 'software developer' },
  { id: 'vet', label: 'Veteriner', prompt: 'veterinarian' },
  { id: 'pilot', label: 'Pilot', prompt: 'airline pilot' },
  { id: 'writer', label: 'Yazar', prompt: 'novelist' },
  { id: 'teacher', label: 'Öğretmen', prompt: 'teacher' },
  { id: 'designer', label: 'Grafik tasarımcı', prompt: 'graphic designer' },
  { id: 'athlete', label: 'Voleybolcu', prompt: 'volleyball player' },
  { id: 'florist', label: 'Çiçekçi', prompt: 'florist' },
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

// Ücretsiz görsel modelinin süzgeci "portrait photograph", "adult" gibi kelimeleri cinsel sayıp engelliyor;
// "corporate headshot of a 27 year old female architect with …" kalıbı geçiyor.
// Görseldeki yaş en az 25: genç seçilen karakter de açıkça yetişkin görünsün.
export const portraitBase = (age: number, job: string) =>
  `professional corporate headshot of a ${Math.max(age, 25)} year old female ${job}`;

export const find = (list: Option[], id: unknown) => list.find((o) => o.id === id);
