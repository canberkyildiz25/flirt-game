import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageBackground, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Character } from '../types';
import { chatBackground } from '../data/backgrounds';
import Portrait from './Portrait';
import { Button } from './ui';
import { IconName } from './Icon';
import { color, font, radius, space, type } from '../theme';

export interface Slide {
  key: string;
  title: string;
  body: string;
  cta: string;
  icon: IconName;
  onPress: () => void;
  scene?: ImageSourcePropType;
  character?: Character;
}

const ROTATE_MS = 6000;
const FADE_MS = 320;

const CREATE_SCENE = require('../../assets/backgrounds/job-designer.jpg');
const NEW_SCENE = require('../../assets/backgrounds/14.jpg');

export function buildSlides(opts: {
  featured?: Character;
  newcomers: Character[];
  onChat: (c: Character) => void;
  onCreate: () => void;
  onBrowse: () => void;
}): Slide[] {
  const slides: Slide[] = [];
  if (opts.featured) {
    const c = opts.featured;
    slides.push({
      key: 'featured',
      title: 'Bu gece kiminle?',
      body: c.tagline ?? `${c.name} seni bekliyor.`,
      cta: `${c.name} ile sohbet et`,
      icon: 'chat',
      onPress: () => opts.onChat(c),
      scene: chatBackground(c),
      character: c,
    });
  }
  slides.push({
    key: 'create',
    title: 'Kendi kızını yarat',
    body: 'Adını, tarzını, konuşmasını sen seç. Portresi saniyeler içinde hazır.',
    cta: 'Hemen başla',
    icon: 'plus',
    onPress: opts.onCreate,
    scene: CREATE_SCENE,
  });
  if (opts.newcomers.length) {
    slides.push({
      key: 'new',
      title: 'Yeni gelenler',
      body: `${opts.newcomers.map((c) => c.name).join(', ')} aramıza katıldı. İlk mesajı kim atacak?`,
      cta: 'Tanış',
      icon: 'cards',
      onPress: opts.onBrowse,
      scene: NEW_SCENE,
      character: opts.newcomers[0],
    });
  }
  return slides;
}

// Kayan banner: 6 saniyede bir yumuşak geçiş; "hareketi azalt" açıksa kendiliğinden kaymaz.
export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = slides[index % slides.length];

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion || slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [reduceMotion, slides.length, index]);

  useEffect(() => {
    fade.setValue(reduceMotion ? 1 : 0);
    Animated.timing(fade, { toValue: 1, duration: FADE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [index]);

  if (!slide) return null;

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.frame, { opacity: fade }]}>
        <ImageBackground source={slide.scene} style={styles.scene} imageStyle={styles.sceneImage} resizeMode="cover">
          <LinearGradient
            colors={['rgba(26,15,20,0.95)', 'rgba(26,15,20,0.75)', 'rgba(26,15,20,0.25)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.row}>
            <View style={styles.text}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.body} numberOfLines={3}>{slide.body}</Text>
              <Button label={slide.cta} icon={slide.icon} compact onPress={slide.onPress} style={styles.cta} />
            </View>
            {slide.character && (
              <View style={styles.card}>
                <Portrait character={slide.character} style={StyleSheet.absoluteFill} />
              </View>
            )}
          </View>
        </ImageBackground>
      </Animated.View>

      {slides.length > 1 && (
        <View style={styles.dots} accessibilityRole="tablist">
          {slides.map((s, i) => (
            <Pressable
              key={s.key}
              accessibilityRole="tab"
              accessibilityLabel={s.title}
              aria-selected={i === index}
              onPress={() => setIndex(i)}
              hitSlop={10}
              style={[styles.dot, i === index && styles.dotOn]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.xxl },
  frame: {
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: color.cream,
    overflow: 'hidden',
    backgroundColor: color.ink2,
  },
  scene: { minHeight: 260, justifyContent: 'center', overflow: 'hidden' },
  sceneImage: { opacity: 0.9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.xl },
  text: { flex: 1, minWidth: 0 },
  title: { ...type.hero, fontSize: 26, lineHeight: 32, marginBottom: space.sm },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.creamDim, marginBottom: space.lg },
  cta: { alignSelf: 'flex-start' },
  card: {
    width: 92,
    height: 126,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: color.cream,
    overflow: 'hidden',
    transform: [{ rotate: '4deg' }],
    backgroundColor: color.ink3,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginTop: space.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.lineStrong },
  dotOn: { width: 22, backgroundColor: color.butter },
});
