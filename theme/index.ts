import * as background from '@/core/theme/background';
import * as color from '@/core/theme/color';
import * as edgeCorners from '@/core/theme/edgeCorners';
import * as spacing from '@/core/theme/spacing';
import * as typography from '@/core/theme/typography';
import { getThemeScheme } from '@/core/theme/config';

export { background, color, edgeCorners, spacing, typography };
export { getThemeScheme };

export const theme = {
  background,
  color,
  edgeCorners,
  spacing,
  typography,
  getScheme: getThemeScheme,
};

export default theme;
