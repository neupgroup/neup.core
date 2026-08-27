import { getPaletteValue } from '@/core/theme/config';

export function getFirst(scheme?: string): string {
  return getPaletteValue('color.first', scheme);
}

export function getSecond(scheme?: string): string {
  return getPaletteValue('color.second', scheme);
}

export function getThird(scheme?: string): string {
  return getPaletteValue('color.third', scheme);
}

export function getFourth(scheme?: string): string {
  return getPaletteValue('color.fourth', scheme);
}

export { getPrimary, getSecondary, getTertiary } from '@/core/theme/color/text';
export { getSuccess, getWarning, getError, getInfo } from '@/core/theme/color/semantic';
