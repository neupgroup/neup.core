import themeConfig from '@/base/theme.json';

export function getSmall(): string {
  return themeConfig.edgeCorners.small;
}

export function getMedium(): string {
  return themeConfig.edgeCorners.medium;
}

export function getLarge(): string {
  return themeConfig.edgeCorners.large;
}
