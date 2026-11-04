// FlirtGame tasarım değişkenleri: koleksiyon kartı oyunu. Koyu şarap zemin, krem kart çerçeveleri,
// domates kırmızısı eylem rengi, tereyağı sarısı ödül/jeton rengi. Renk ve yazı her yerde buradan gelir.

export const color = {
  ink: '#1A0F14', // sayfa zemini
  ink2: '#24161C', // kart ve panel yüzeyi
  ink3: '#30202A', // yükseltilmiş yüzey, basılı hal
  line: 'rgba(255,244,224,0.12)',
  lineStrong: 'rgba(255,244,224,0.24)',
  cream: '#FFF4E0', // metin ve kart çerçevesi
  creamDim: 'rgba(255,244,224,0.70)',
  creamFaint: 'rgba(255,244,224,0.45)',
  red: '#FF4D3D', // ana eylem
  redPressed: '#E03A2B',
  butter: '#FFD447', // jeton, ödül, oyuncu balonu
  butterInk: '#2A1A0A', // sarı üstündeki metin
  danger: '#FF8A7A',
  ok: '#9BE7B4',
} as const;

export const font = {
  display: 'Unbounded_800ExtraBold',
  displayMedium: 'Unbounded_600SemiBold',
  body: 'Rubik_400Regular',
  medium: 'Rubik_500Medium',
  bold: 'Rubik_700Bold',
} as const;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

// Yazı ölçeği. Özel yazı tiplerinde kalınlık aile adıyla seçilir, fontWeight kullanılmaz.
export const type = {
  hero: { fontFamily: font.display, fontSize: 34, lineHeight: 40, color: color.cream, letterSpacing: -0.5 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 32, color: color.cream, letterSpacing: -0.3 },
  heading: { fontFamily: font.displayMedium, fontSize: 18, lineHeight: 24, color: color.cream },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.creamDim },
  bodyStrong: { fontFamily: font.medium, fontSize: 15, lineHeight: 22, color: color.cream },
  label: { fontFamily: font.bold, fontSize: 12, lineHeight: 16, color: color.creamFaint, letterSpacing: 0.6 },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: color.creamFaint },
  button: { fontFamily: font.bold, fontSize: 16, lineHeight: 20 },
} as const;
