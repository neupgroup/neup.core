import { serverLink } from './shared';
import type { Link } from './shared';

export function ftp(url: string): Link {
  return serverLink(url, 'ftp');
}
