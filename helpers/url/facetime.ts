import { fixed, address } from './shared';
import type { Link } from './shared';

export function facetime(recipient: string): Link {
  return fixed(`facetime:${address(recipient)}`);
}
