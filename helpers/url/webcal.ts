import { serverLink } from './shared';
import type { Link } from './shared';

export function webcal(url: string): Link {
  return serverLink(url, 'webcal');
}
