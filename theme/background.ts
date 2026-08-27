import { getPaletteValue } from '@/core/theme/config';

export function getPrimary(scheme?: string): string {
  return getPaletteValue('background.primary', scheme);
}

export function getSecondary(scheme?: string): string {
  return getPaletteValue('background.secondary', scheme);
}

export function getTertiary(scheme?: string): string {
  return getPaletteValue('background.tertiary', scheme);
}
