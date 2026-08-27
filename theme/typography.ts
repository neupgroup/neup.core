import themeConfig from '@/base/theme.json';

export type TypographyConfig = typeof themeConfig.typography;
export type TypographyVariant = keyof TypographyConfig;

export function getTypography(variant: TypographyVariant = 'primary') {
  return themeConfig.typography[variant];
}

export function getPrimary() {
  return getTypography('primary');
}

export function getSecondary() {
  return getTypography('secondary');
}

export function getFontFamily(variant: TypographyVariant = 'primary'): string {
  return getTypography(variant).fontFamily;
}

export function getFontUrl(variant: TypographyVariant = 'primary'): string {
  return getTypography(variant).fontUrl;
}

export function getFontSize(variant: TypographyVariant = 'primary'): string {
  return getTypography(variant).fontSize;
}

export function getFontWeight(variant: TypographyVariant = 'primary'): string {
  return getTypography(variant).fontWeight;
}

export function getLineHeight(variant: TypographyVariant = 'primary'): string {
  return getTypography(variant).lineHeight;
}
