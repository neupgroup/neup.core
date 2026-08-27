import themeConfig from '@/base/theme.json';

export type ThemeConfig = typeof themeConfig;
export type ThemeScheme = keyof ThemeConfig['color'];
export type ThemePalette = ThemeConfig['color'][ThemeScheme];

export const theme = themeConfig;

const themeSchemes: readonly ThemeScheme[] = ['dark', 'light', 'black', 'custom'];

export function getThemeScheme(scheme?: string): ThemeScheme {
  const configuredScheme = scheme ?? theme.scheme;
  return themeSchemes.includes(configuredScheme as ThemeScheme)
    ? configuredScheme as ThemeScheme
    : 'light';
}

export function getThemePalette(scheme?: string): ThemePalette {
  return theme.color[getThemeScheme(scheme)];
}

export function getPaletteValue(key: keyof ThemePalette, scheme?: string): string {
  return getThemePalette(scheme)[key];
}
