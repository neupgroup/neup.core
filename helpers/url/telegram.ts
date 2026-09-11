import { fixed } from './shared';
import type { Link } from './shared';

export function telegram(username: string): Link {
  return fixed(`tg://resolve?domain=${encodeURIComponent(username.trim().replace(/^@/, ''))}`);
}
