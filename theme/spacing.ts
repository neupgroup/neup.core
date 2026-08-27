import themeConfig from '@/base/theme.json';

export function getXs(): string {
  return themeConfig.spacing.xs;
}

export function getSm(): string {
  return themeConfig.spacing.sm;
}

export function getMd(): string {
  return themeConfig.spacing.md;
}

export function getLg(): string {
  return themeConfig.spacing.lg;
}

export function getXl(): string {
  return themeConfig.spacing.xl;
}

export function get2xl(): string {
  return themeConfig.spacing['2xl'];
}

export function get3xl(): string {
  return themeConfig.spacing['3xl'];
}

export function get4xl(): string {
  return themeConfig.spacing['4xl'];
}
