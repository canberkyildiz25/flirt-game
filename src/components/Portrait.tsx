import React from 'react';
import { Image, StyleProp, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { Character, RelationshipStage } from '../types';
import { STAGE_ORDER } from '../utils/characterUtils';
import { CharacterLook, PORTRAITS } from '../data/portraits';
import { PHOTOS } from '../data/portraitPhotos';

// Fotoğraflar yapay zekâyla üretilmiş kurgusal kişilerdir (scripts/generate-portraits.mjs).
// Fotoğrafı olmayan karakter kesik kağıt çizimle görünür.
const INK = '#1B1320';
const HEAD = 'M36 36 C36 22 64 22 64 36 C64 50 57 60 50 60 C43 60 36 50 36 36 Z';
const SHOULDERS = 'M10 100 C12 82 30 77 44 72 L56 72 C70 77 88 82 90 100 Z';

// Motifin başın çevresinde belirdiği yerler; ilişki ilerledikçe sırayla dolar.
const MOTIF_SPOTS = [
  [14, 22], [86, 26], [10, 52], [90, 56], [24, 8], [76, 9], [18, 72], [82, 74],
];

function Face({ look, stageIndex }: { look: CharacterLook; stageIndex: number }) {
  const blush = stageIndex >= 3;
  const closed = stageIndex === 5;
  // İlk aşamada bakışını kaçırır.
  const gaze = stageIndex === 0 ? 1.3 : 0;
  const browLift = stageIndex >= 2 ? 0.8 : 0;
  const mouth = [
    'M46 52 L54 52',
    'M45.5 51.6 C48 53 52 53 54.5 51.6',
    'M45 51 C47.5 54 52.5 54 55 51',
    'M45 51 C47.5 54.5 52.5 54.5 55 51',
    'M44.5 50.8 C47.5 55 52.5 55 55.5 50.8',
    'M44.5 50.8 C47.5 55.5 52.5 55.5 55.5 50.8',
  ][stageIndex];

  return (
    <G>
      {blush && (
        <>
          <Ellipse cx="41" cy="47" rx="3.2" ry="2" fill={look.lips} opacity={0.35} />
          <Ellipse cx="59" cy="47" rx="3.2" ry="2" fill={look.lips} opacity={0.35} />
        </>
      )}
      <Path
        d={`M40 ${37.4 - browLift} C42 ${36 - browLift} 45 ${36 - browLift} 47 ${37.2 - browLift}`}
        stroke={look.brow}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M53 ${37.2 - browLift} C55 ${36 - browLift} 58 ${36 - browLift} 60 ${37.4 - browLift}`}
        stroke={look.brow}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
      {closed ? (
        <>
          <Path d="M40.5 41.5 C42 40 45 40 46.5 41.5" stroke={INK} strokeWidth={0.9} strokeLinecap="round" fill="none" />
          <Path d="M53.5 41.5 C55 40 58 40 59.5 41.5" stroke={INK} strokeWidth={0.9} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <Path d="M40.5 41 C42 39 45 39 46.5 41 C45 42.6 42 42.6 40.5 41 Z" fill="#FBF6EC" />
          <Path d="M53.5 41 C55 39 58 39 59.5 41 C58 42.6 55 42.6 53.5 41 Z" fill="#FBF6EC" />
          <Circle cx={43.5 + gaze} cy="40.9" r="1.35" fill={INK} />
          <Circle cx={56.5 + gaze} cy="40.9" r="1.35" fill={INK} />
          <Path d="M40.2 41 C42 38.8 45 38.8 46.8 40.8" stroke={INK} strokeWidth={0.7} strokeLinecap="round" fill="none" />
          <Path d="M53.2 40.8 C55 38.8 58 38.8 59.8 41" stroke={INK} strokeWidth={0.7} strokeLinecap="round" fill="none" />
        </>
      )}
      <Path d="M50 42 L49 47 L50.6 47.4" stroke={look.shade} strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={mouth} stroke={look.lips} strokeWidth={1.4} strokeLinecap="round" fill="none" />
    </G>
  );
}

interface Props {
  character: Character;
  stage?: RelationshipStage;
  style?: StyleProp<ViewStyle>;
}

export default function Portrait({ character, stage, style }: Props) {
  const look = PORTRAITS[character.id];
  const stageIndex = STAGE_ORDER.indexOf(stage ?? character.stage);
  const motifCount = 2 + stageIndex + (stageIndex >= 4 ? 1 : 0);
  const { color } = character;
  const photo = character.portraitUrl ? { uri: character.portraitUrl } : PHOTOS[character.id];

  if (photo) {
    return (
      <View style={[{ overflow: 'hidden', backgroundColor: INK }, style]}>
        <Image
          source={photo}
          resizeMode="cover"
          accessibilityLabel={`${character.name}, kurgusal karakter portresi`}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    );
  }

  if (!look) {
    return (
      <View style={[{ overflow: 'hidden', backgroundColor: character.color, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{character.name.slice(0, 1)}</Text>
      </View>
    );
  }

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: INK }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Rect width="100" height="100" fill={INK} />
        <Path d="M0 100 L0 58 C22 30 34 12 62 6 C80 3 94 12 100 20 L100 100 Z" fill={color} opacity={0.34 + stageIndex * 0.08} />
        {MOTIF_SPOTS.slice(0, motifCount).map(([x, y]) => (
          <G key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <Path d={look.motif} fill="#FBF6EC" opacity={0.78} />
          </G>
        ))}
        {look.hairBack.map((d) => (
          <Path key={d} d={d} fill={look.hair} />
        ))}
        <Rect x="44" y="54" width="12" height="20" fill={look.shade} />
        <Path d={SHOULDERS} fill={look.top} />
        {look.clothes}
        <Path d={HEAD} fill={look.skin} />
        <Face look={look} stageIndex={stageIndex} />
        <Path d={look.hairFront} fill={look.hair} />
        {look.extras}
      </Svg>
    </View>
  );
}
