import { getPaletteValue } from '@/core/theme/config';

export function getPrimary(scheme?: string): string {
  return getPaletteValue('text.primary', scheme);
}

export function getSecondary(scheme?: string): string {
  return getPaletteValue('text.secondary', scheme);
}

export function getTertiary(scheme?: string): string {
  return getPaletteValue('text.tertiary', scheme);
}
