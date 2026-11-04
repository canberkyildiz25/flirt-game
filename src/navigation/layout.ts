import { Platform, useWindowDimensions } from 'react-native';

export const SIDEBAR_WIDTH = 232;
const WIDE_FROM = 900;
const MOBILE_COLUMN = 520;

// Geniş web ekranında sol menü açılır; telefonda ve dar pencerede uygulama tek sütundur.
export function useLayout() {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= WIDE_FROM;
  const contentWidth = isWide ? width - SIDEBAR_WIDTH : Math.min(width, MOBILE_COLUMN);
  const columns = contentWidth >= 1100 ? 4 : contentWidth >= 720 ? 3 : 2;
  return { isWide, contentWidth, columns };
}
