import type { Link } from './shared';

export interface IntentLink extends Link {
  scheme(scheme: string): this;
}

export function intent(target: string): IntentLink {
  const source = target.trim();
  const parsed = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(source) ? source : `https://${source}`);
  let scheme = parsed.protocol.slice(0, -1);
  if (parsed.hash) throw new TypeError('Intent targets cannot contain a fragment.');
  const destination = parsed.href.slice(parsed.protocol.length + 2);
  return {
    scheme(value) {
      if (!/^[a-z][a-z\d+.-]*$/i.test(value)) throw new TypeError('Invalid intent scheme.');
      scheme = value.toLowerCase();
      return this;
    },
    get: () => `intent://${destination}#Intent;scheme=${scheme};end`,
  };
}
