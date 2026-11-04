import React, { ReactNode } from 'react';
import { Circle, Path, Rect } from 'react-native-svg';

export interface CharacterLook {
  skin: string;
  shade: string;
  hair: string;
  brow: string;
  lips: string;
  top: string;
  hairBack: string[];
  hairFront: string;
  motif: string; // başlangıç noktası çevresinde, yaklaşık 8 birimlik işaret
  clothes?: ReactNode;
  extras?: ReactNode;
}

const FRONT = {
  part: 'M35 40 C33 19 67 19 65 40 C62 32 54 28 50 25 C46 28 38 32 35 40 Z',
  side: 'M35 42 C32 17 68 17 65 42 C62 30 50 34 40 32 C38 35 36 38 35 42 Z',
  fringe: 'M35 38 C33 18 67 18 65 38 C58 33.5 42 33.5 35 38 Z',
  slick: 'M35 36 C35 19 65 19 65 36 C60 28 40 28 35 36 Z',
  curl: 'M35 38 C32 19 44 17 50 19 C58 17 68 21 65 38 C62 30 58 32 54 30 C50 33 44 30 42 33 C39 32 37 34 35 38 Z',
};

const BACK = {
  long: 'M32 34 C30 13 70 13 68 34 L72 80 L28 80 Z',
  curls: 'M50 11 C38 7 26 15 26 27 C15 34 17 50 23 56 C19 66 30 75 38 70 L62 70 C70 75 81 66 77 56 C83 50 85 34 74 27 C74 15 62 7 50 11 Z',
  bob: 'M33 34 C31 15 69 15 67 34 L70 58 C62 63 38 63 30 58 Z',
  waves: 'M33 32 C30 13 70 13 67 32 C75 44 66 52 75 63 C79 73 70 81 66 83 L34 83 C30 81 21 73 25 63 C34 52 25 44 33 32 Z',
  cap: 'M35 34 C35 19 65 19 65 34 L65 44 L35 44 Z',
};

const STROKE = { strokeLinecap: 'round' as const, fill: 'none' };

export const PORTRAITS: Record<string, CharacterLook> = {
  // Ayşe: bere, küt saç, boyalı önlük
  '1': {
    skin: '#E9BE9F', shade: '#CC9A7A', hair: '#2D1B33', brow: '#2D1B33', lips: '#B23A5E', top: '#E4D7BE',
    hairBack: [BACK.bob], hairFront: FRONT.fringe,
    motif: 'M0 -4 C3 -4 5 -1 4 2 C3 5 -2 5 -4 2 C-5 -1 -3 -4 0 -4 Z',
    clothes: (
      <>
        <Path d="M36 76 L38 100 M64 76 L62 100" stroke="#6D4C3D" strokeWidth={2.5} />
        <Circle cx="30" cy="92" r="2.4" fill="#E91E8C" />
        <Circle cx="70" cy="88" r="2" fill="#2F7DD1" />
        <Circle cx="66" cy="95" r="1.6" fill="#F1B434" />
      </>
    ),
    extras: (
      <>
        <Path d="M32 25 C33 13 62 10 71 20 C72 25 66 26 60 25 C50 22 40 23 32 25 Z" fill="#B3263F" />
        <Path d="M60 42 L63 46" stroke="#2F7DD1" strokeWidth={1.6} strokeLinecap="round" />
      </>
    ),
  },
  // Zeynep: önlük, steteskop, gözlük, topuz
  '2': {
    skin: '#F0CBAE', shade: '#D2A583', hair: '#7A2E3A', brow: '#5A2029', lips: '#A7334B', top: '#F5F1E8',
    hairBack: [BACK.cap, 'M42 22 C40 10 60 10 58 22 Z'], hairFront: FRONT.part,
    motif: 'M-1.4 -4 H1.4 V-1.4 H4 V1.4 H1.4 V4 H-1.4 V1.4 H-4 V-1.4 H-1.4 Z',
    clothes: (
      <>
        <Path d="M44 72 L50 92 L56 72 Z" fill="#3E7C8C" />
        <Path d="M42 74 C36 84 42 94 48 95 M58 74 C64 84 60 92 54 95" stroke="#1B1320" strokeWidth={1.4} {...STROKE} />
        <Circle cx="51" cy="96" r="2.6" fill="#1B1320" />
      </>
    ),
    extras: (
      <>
        <Rect x="38.8" y="38" width="9" height="6.4" rx="1.6" stroke="#1B1320" strokeWidth={0.8} fill="none" />
        <Rect x="52.2" y="38" width="9" height="6.4" rx="1.6" stroke="#1B1320" strokeWidth={0.8} fill="none" />
        <Path d="M47.8 40.5 L52.2 40.5" stroke="#1B1320" strokeWidth={0.8} />
      </>
    ),
  },
  // Elif: kıvırcık bakır saç, gitar askısı, halka küpe
  '3': {
    skin: '#D9A27E', shade: '#B98059', hair: '#A8481E', brow: '#6B2E12', lips: '#8E2C2C', top: '#25364F',
    hairBack: [BACK.curls], hairFront: FRONT.curl,
    motif: 'M-1 3 C-3 2 -5 4 -3.5 5.5 C-2 6.5 0 5.5 0 3.5 V-4 L4 -3 V-1 L1 -2 V3 C1 3 0 3.4 -1 3 Z',
    clothes: <Path d="M28 79 L72 100 L65 100 L24 82 Z" fill="#E7B23C" />,
    extras: (
      <>
        <Circle cx="35" cy="50" r="2.6" stroke="#F1C65C" strokeWidth={0.9} fill="none" />
        <Circle cx="65" cy="50" r="2.6" stroke="#F1C65C" strokeWidth={0.9} fill="none" />
      </>
    ),
  },
  // Selin: siyah asimetrik saç, balıkçı yaka, kamera askısı
  '4': {
    skin: '#C68863', shade: '#A56D4B', hair: '#14101C', brow: '#14101C', lips: '#7D2840', top: '#39424E',
    hairBack: [BACK.bob, 'M60 30 C74 40 72 58 66 66 L60 50 Z'], hairFront: FRONT.side,
    motif: 'M0 -4.5 A4.5 4.5 0 1 1 -0.01 -4.5 Z M0 -2 A2 2 0 1 0 0.01 -2 Z',
    clothes: (
      <>
        <Path d="M42 66 L58 66 L60 76 C54 79 46 79 40 76 Z" fill="#39424E" />
        <Path d="M41 77 L36 100 M59 77 L64 100" stroke="#8C5A32" strokeWidth={1.6} />
      </>
    ),
  },
  // Naz: iki örgü, çil, sweatshirt
  '5': {
    skin: '#E8B998', shade: '#C9956F', hair: '#4A2A1C', brow: '#3A1F13', lips: '#B5484C', top: '#3F7F54',
    hairBack: [
      BACK.cap,
      'M36 40 C29 50 31 68 28 84 L35 84 C38 68 38 52 40 46 Z',
      'M64 40 C71 50 69 68 72 84 L65 84 C62 68 62 52 60 46 Z',
    ],
    hairFront: FRONT.part,
    motif: 'M-3 -2 C-3 -6 4 -6 4 -2 C4 0 1 0 1 3 M1 5.4 A0.9 0.9 0 1 0 1.01 5.4 Z',
    clothes: (
      <Path d="M36 76 C42 84 58 84 64 76 L68 80 C60 90 40 90 32 80 Z" fill="#2F6341" />
    ),
    extras: (
      <>
        <Circle cx="42" cy="46" r="0.5" fill="#8A5335" />
        <Circle cx="44.5" cy="47" r="0.5" fill="#8A5335" />
        <Circle cx="58" cy="46" r="0.5" fill="#8A5335" />
        <Circle cx="55.5" cy="47" r="0.5" fill="#8A5335" />
        <Rect x="28" y="78" width="7" height="3" fill="#F1E3C4" />
        <Rect x="65" y="78" width="7" height="3" fill="#F1E3C4" />
      </>
    ),
  },
  // İrem: yana taranmış düz saç, ceket ve beyaz gömlek
  '6': {
    skin: '#E2AF8E', shade: '#C28C69', hair: '#241A2B', brow: '#241A2B', lips: '#9C2F35', top: '#1E2533',
    hairBack: ['M33 34 C31 15 69 15 67 34 L70 70 L30 70 Z'], hairFront: FRONT.slick,
    motif: 'M-2 4 H2 L1 0 A2.2 2.2 0 1 0 -1 0 Z',
    clothes: (
      <>
        <Path d="M44 72 L50 96 L56 72 Z" fill="#F5F1E8" />
        <Path d="M42 73 L50 97 L38 86 L37 76 Z M58 73 L50 97 L62 86 L63 76 Z" fill="#2E384B" />
      </>
    ),
  },
  // Beren: uzun açık saç, başta güneş gözlüğü, iri küpe
  '7': {
    skin: '#EEC6A8', shade: '#CFA07E', hair: '#C99A56', brow: '#7E5A2C', lips: '#C8453F', top: '#F07F2E',
    hairBack: [BACK.waves], hairFront: FRONT.part,
    motif: 'M0 -5 C0.8 -1.5 1.5 -0.8 5 0 C1.5 0.8 0.8 1.5 0 5 C-0.8 1.5 -1.5 0.8 -5 0 C-1.5 -0.8 -0.8 -1.5 0 -5 Z',
    clothes: <Path d="M42 74 C46 80 54 80 58 74 L60 77 C54 84 46 84 40 77 Z" fill="#FBF6EC" />,
    extras: (
      <>
        <Path d="M37 27 C42 22 47 22 49 26 L51 26 C53 22 58 22 63 27 C60 31 53 30 51 28 L49 28 C47 30 40 31 37 27 Z" fill="#1B1320" />
        <Path d="M35 47 L33 53 L37 53 Z M65 47 L63 53 L67 53 Z" fill="#FBF6EC" />
      </>
    ),
  },
  // Luna: uzun koyu dalgalar, saçta çiçek, fırfır yaka
  '8': {
    skin: '#C98E68', shade: '#A9714E', hair: '#1E1224', brow: '#1E1224', lips: '#C21F4E', top: '#A81D3F',
    hairBack: [BACK.waves], hairFront: FRONT.side,
    motif: 'M-5 2 C-3 -3 -1 -3 0 0 C1 3 3 3 5 -2 M-5 2 Z',
    clothes: (
      <Path d="M32 80 C36 74 40 84 44 78 C47 86 53 86 56 78 C60 84 64 74 68 80 C62 90 38 90 32 80 Z" fill="#D63A5F" />
    ),
    extras: (
      <>
        <Circle cx="35" cy="28" r="3" fill="#F7A9C0" />
        <Circle cx="38.8" cy="31" r="3" fill="#F7A9C0" />
        <Circle cx="32" cy="32" r="3" fill="#F7A9C0" />
        <Circle cx="35.5" cy="35" r="3" fill="#F7A9C0" />
        <Circle cx="35.5" cy="31.2" r="1.8" fill="#F1C65C" />
      </>
    ),
  },
  // Derin: üstte topuz, ay kolye, sade üst
  '9': {
    skin: '#B97F5C', shade: '#996543', hair: '#2E2238', brow: '#2E2238', lips: '#8C3A52', top: '#CFC3E0',
    hairBack: [BACK.cap, 'M41 22 C37 6 63 6 59 22 Z'], hairFront: FRONT.slick,
    motif: 'M2 -4.5 A4.8 4.8 0 1 0 2 4.5 A3.6 3.6 0 1 1 2 -4.5 Z',
    clothes: (
      <>
        <Path d="M42 74 C44 86 56 86 58 74" stroke="#4E3B6B" strokeWidth={0.9} {...STROKE} />
        <Path d="M51.5 83 A3 3 0 1 0 51.5 89 A2.2 2.2 0 1 1 51.5 83 Z" fill="#F1C65C" />
      </>
    ),
  },
  // Mia: kısa kırmızı saç, sahne fırfırı, keskin göz kalemi
  '10': {
    skin: '#F2D2B8', shade: '#D3A988', hair: '#C2252F', brow: '#7E1820', lips: '#8E1630', top: '#1B1320',
    hairBack: ['M34 34 C32 16 68 16 66 34 L66 46 L34 46 Z'], hairFront: FRONT.side,
    motif: 'M-5 -3 C-2 -4.5 2 -4.5 5 -3 C5 2 3 5 0 5 C-3 5 -5 2 -5 -3 Z M-3 -1 L-1 -1 L-1 0 L-3 0 Z',
    clothes: (
      <Path d="M30 76 L38 70 L42 77 L50 70 L58 77 L62 70 L70 76 L63 84 L56 80 L50 86 L44 80 L37 84 Z" fill="#F5F1E8" />
    ),
    extras: (
      <>
        <Path d="M40.2 40.8 L37.6 39.2" stroke="#1B1320" strokeWidth={0.9} strokeLinecap="round" />
        <Path d="M59.8 40.8 L62.4 39.2" stroke="#1B1320" strokeWidth={0.9} strokeLinecap="round" />
      </>
    ),
  },
  // Ceren: keskin platin kesim, dik yaka, boynunda mezura
  '11': {
    skin: '#DDA682', shade: '#BC8561', hair: '#E9E2D4', brow: '#6F6250', lips: '#7A1F5C', top: '#2C1A3F',
    hairBack: ['M33 34 C31 15 69 15 67 34 L72 64 L60 54 L33 50 Z'], hairFront: FRONT.side,
    motif: 'M-5 0 L0 -5 L5 0 L0 5 Z',
    clothes: (
      <>
        <Path d="M38 76 L44 66 L50 80 L56 66 L62 76 L50 92 Z" fill="#4A2C66" />
        <Path d="M42 72 C39 84 37 92 37 100 L41 100 C42 92 44 84 46 76 Z" fill="#F1C65C" />
        <Path d="M58 72 C61 84 63 92 63 100 L59 100 C58 92 56 84 54 76 Z" fill="#F1C65C" />
      </>
    ),
  },
  // Pınar: bandana, at kuyruğu, çift düğmeli şef ceketi
  '12': {
    skin: '#CF9670', shade: '#AE7650', hair: '#35201A', brow: '#35201A', lips: '#A5352B', top: '#F5F1E8',
    hairBack: [BACK.cap, 'M60 24 C80 22 84 46 76 66 C72 54 70 42 62 36 Z'], hairFront: FRONT.slick,
    motif: 'M0 -5 C3 -2 4 0 3 2.5 C2.4 4.5 -2.4 4.5 -3 2.5 C-3.6 0.5 -1.5 0 0 -5 Z',
    clothes: (
      <>
        <Path d="M44 72 L56 72 L60 78 L44 88 Z" fill="#E3DDD0" />
        <Circle cx="46" cy="92" r="1.3" fill="#1B1320" />
        <Circle cx="55" cy="92" r="1.3" fill="#1B1320" />
        <Circle cx="50" cy="83" r="1.3" fill="#1B1320" />
      </>
    ),
    extras: (
      <>
        <Path d="M35 31 C36 18 64 18 65 31 C56 27 44 27 35 31 Z" fill="#D2452F" />
        <Path d="M64 27 L72 22 L71 30 Z" fill="#D2452F" />
      </>
    ),
  },
};
