import { address } from './shared';
import type { Link } from './shared';

export interface SkypeLink extends Link {
  action(action: 'chat' | 'call'): this;
}

export function skype(username: string): SkypeLink {
  let action: 'chat' | 'call' = 'chat';
  return {
    action(value) {
      if (value !== 'chat' && value !== 'call') throw new TypeError('Skype action must be chat or call.');
      action = value;
      return this;
    },
    get: () => `skype:${address(username)}?${action}`,
  };
}
