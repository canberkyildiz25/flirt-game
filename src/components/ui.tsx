import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { color, font, radius, space, type } from '../theme';
import { RelationshipStage } from '../types';
import Icon, { IconName } from './Icon';

export const STAGE_LABELS: Record<RelationshipStage, string> = {
  stranger: 'Yabancı',
  acquaintance: 'Tanıdık',
  friend: 'Arkadaş',
  crush: 'Crush',
  romantic: 'Romantik',
  lover: 'Sevgili',
};

type ButtonVariant = 'primary' | 'reward' | 'ghost';

const BUTTON: Record<ButtonVariant, { bg: string; pressed: string; text: string; border?: string }> = {
  primary: { bg: color.red, pressed: color.redPressed, text: color.cream },
  reward: { bg: color.butter, pressed: '#F0C232', text: color.butterInk },
  ghost: { bg: 'transparent', pressed: color.ink3, text: color.cream, border: color.lineStrong },
};

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

// Basınca bir tık aşağı iner: kart oyunu düğmesi hissi. Yalnızca transform değişir.
export function Button({ label, onPress, variant = 'primary', icon, disabled, busy, style, compact }: ButtonProps) {
  const v = BUTTON[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      aria-disabled={!!disabled}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: pressed ? v.pressed : v.bg, borderColor: v.border ?? 'transparent' },
        pressed && { transform: [{ translateY: 1 }] },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={v.text} />}
          <Text style={[type.button, { color: v.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function CoinPill({ amount }: { amount: number }) {
  return (
    <View style={styles.coinPill} accessibilityLabel={`${amount} jeton`}>
      <Icon name="coin" size={18} />
      <Text style={styles.coinText}>{amount}</Text>
    </View>
  );
}

// Sevgi 0-100 arası; 5 kalbe bölünür, yarım kalp yoktur, okunaklı kalsın diye.
export function HeartMeter({ value, size = 14, tint = color.red }: { value: number; size?: number; tint?: string }) {
  const full = Math.round(value / 20);
  return (
    <View style={styles.hearts} accessibilityLabel={`Sevgi ${value} / 100`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon key={i} name={i < full ? 'heart' : 'heartOutline'} size={size} color={i < full ? tint : color.creamFaint} />
      ))}
    </View>
  );
}

export function StageRibbon({ stage, tint }: { stage: RelationshipStage; tint: string }) {
  return (
    <View style={[styles.ribbon, { backgroundColor: tint }]}>
      <Text style={styles.ribbonText}>{STAGE_LABELS[stage]}</Text>
    </View>
  );
}

export function Chip({
  label, selected, onPress, role = 'checkbox',
}: { label: string; selected?: boolean; onPress?: () => void; role?: 'checkbox' | 'tab' }) {
  return (
    <Pressable
      accessibilityRole={role}
      aria-checked={role === 'checkbox' ? !!selected : undefined}
      aria-selected={role === 'tab' ? !!selected : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipOn,
        pressed && !selected && { backgroundColor: color.ink3 },
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: color.ink3 }]}
    >
      <Icon name={icon} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonCompact: { minHeight: 40, paddingHorizontal: space.lg },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
    paddingRight: 12,
    minHeight: 34,
    borderRadius: radius.pill,
    backgroundColor: color.ink2,
    borderWidth: 1,
    borderColor: 'rgba(255,212,71,0.35)',
  },
  coinText: { fontFamily: font.bold, fontSize: 15, color: color.butter },
  hearts: { flexDirection: 'row', gap: 2 },
  ribbon: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  ribbonText: { fontFamily: font.bold, fontSize: 11, color: color.ink, letterSpacing: 0.4 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
  },
  chipOn: { backgroundColor: color.cream, borderColor: color.cream },
  chipText: { fontFamily: font.medium, fontSize: 14, color: color.creamDim },
  chipTextOn: { color: color.ink },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.ink2,
    borderWidth: 1,
    borderColor: color.line,
  },
});
