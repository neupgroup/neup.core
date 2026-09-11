import { address } from './shared';
import type { Link } from './shared';

export interface EmailLink extends Link {
  subject(subject: string): this;
  body(message?: string): this;
}

export function email(email: string): EmailLink {
  const recipient = address(email);
  const params = new Map<string, string>();
  return {
    subject(subject) {
      params.set('subject', subject);
      return this;
    },
    body(message = '') {
      if (message) params.set('body', message);
      else params.delete('body');
      return this;
    },
    get() {
      const query = Array.from(params, ([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
      return `mailto:${recipient}${query ? `?${query}` : ''}`;
    },
  };
}
