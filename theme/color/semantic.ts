import { getPaletteValue } from '@/core/theme/config';

export function getSuccess(scheme?: string): string {
  return getPaletteValue('semantic.success', scheme);
}

export function getWarning(scheme?: string): string {
  return getPaletteValue('semantic.warning', scheme);
}

export function getError(scheme?: string): string {
  return getPaletteValue('semantic.error', scheme);
}

export function getInfo(scheme?: string): string {
  return getPaletteValue('semantic.info', scheme);
}
