import { fixed } from './shared';
import type { Link } from './shared';

export function maps(query: string): Link {
  return fixed(`maps://?q=${encodeURIComponent(query)}`);
}
