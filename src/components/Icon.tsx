import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { color as palette } from '../theme';

export type IconName =
  | 'coin' | 'heart' | 'heartOutline' | 'lock' | 'chat' | 'plus' | 'home' | 'cards'
  | 'back' | 'ticket' | 'spark' | 'user' | 'send' | 'restart';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

// Emoji yerine tek çizgi kalınlığında, 24'lük ızgarada çizilmiş simgeler.
export default function Icon({ name, size = 20, color = palette.cream }: Props) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'coin' && (
        <>
          <Circle cx="12" cy="12" r="9" fill={palette.butter} />
          <Circle cx="12" cy="12" r="6" stroke={palette.butterInk} strokeWidth={1.5} fill="none" opacity={0.5} />
          <Path d="M12 8.5v7M10 10.5h3a1.5 1.5 0 0 1 0 3h-2" stroke={palette.butterInk} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </>
      )}
      {name === 'heart' && (
        <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill={color} />
      )}
      {name === 'heartOutline' && (
        <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" {...stroke} />
      )}
      {name === 'lock' && (
        <>
          <Rect x="5" y="11" width="14" height="9" rx="2.5" {...stroke} />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke} />
        </>
      )}
      {name === 'chat' && <Path d="M5 5h14v10H10l-4 4v-4H5z" {...stroke} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...stroke} />}
      {name === 'home' && <Path d="M4 11l8-6 8 6v8h-5v-5H9v5H4z" {...stroke} />}
      {name === 'cards' && (
        <>
          <Rect x="7" y="4" width="11" height="15" rx="2" {...stroke} />
          <Path d="M5 7.5v11a2 2 0 0 0 2 2h8" {...stroke} />
        </>
      )}
      {name === 'back' && <Path d="M15 5l-7 7 7 7" {...stroke} />}
      {name === 'ticket' && (
        <Path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" {...stroke} />
      )}
      {name === 'spark' && <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill={color} />}
      {name === 'user' && (
        <>
          <Circle cx="12" cy="9" r="3.5" {...stroke} />
          <Path d="M5 20a7 7 0 0 1 14 0" {...stroke} />
        </>
      )}
      {name === 'send' && <Path d="M5 12l14-7-5 14-2.5-5.5z" fill={color} />}
      {name === 'restart' && <Path d="M5 12a7 7 0 1 0 2-5M5 4v4h4" {...stroke} />}
    </Svg>
  );
}
