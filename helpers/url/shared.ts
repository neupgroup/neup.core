export interface Link {
  get(): string;
}

export interface PhoneLink extends Link {
  /** Placeholder only: does not encrypt, hide, or otherwise protect the link yet. */
  protect(): Link;
}

export interface MessageLink extends PhoneLink {
  body(message?: string): PhoneLink;
}

export interface PhoneNumberStep<T extends PhoneLink> {
  number(number: string): T;
}

export interface PhoneStart<T extends PhoneLink> extends PhoneNumberStep<T> {
  country(country: string): PhoneNumberStep<T>;
}

export interface PhoneFactory<T extends PhoneLink> {
  (): PhoneStart<T>;
  (number: string): T;
}

// Country aliases supported by country(); any numeric calling code also works.
const callingCodes: Readonly<Record<string, string>> = {
  np: '977', in: '91', us: '1', ca: '1', gb: '44', uk: '44', au: '61',
  nz: '64', cn: '86', jp: '81', kr: '82', sg: '65', my: '60', th: '66',
  id: '62', ph: '63', vn: '84', bd: '880', pk: '92', lk: '94', bt: '975',
  mv: '960', ae: '971', sa: '966', qa: '974', kw: '965', bh: '973', om: '968',
  de: '49', fr: '33', es: '34', it: '39', pt: '351', nl: '31', be: '32',
  ch: '41', at: '43', ie: '353', dk: '45', se: '46', no: '47', fi: '358',
  pl: '48', ru: '7', ua: '380', tr: '90', il: '972', za: '27', eg: '20',
  ng: '234', ke: '254', br: '55', mx: '52', ar: '54', cl: '56', co: '57',
};

function countryCode(country: string): string {
  const value = country.trim().toLowerCase();
  if (/^\+?[1-9]\d{0,2}$/.test(value)) return value.replace(/^\+/, '');
  if (Object.hasOwn(callingCodes, value)) return callingCodes[value];
  throw new TypeError(`Unsupported country "${country}". Use a numeric calling code instead.`);
}

function phoneNumber(input: string): string {
  const number = input.trim().replace(/[\s().-]/g, '').replace(/^00/, '+');
  if (!/^\+?\d+$/.test(number)) throw new TypeError('Phone number must contain digits and an optional leading +.');
  return number;
}

export function protectable(value: string): PhoneLink {
  return {
    get: () => value,
    // Reserved for future protection behavior; currently only ends configuration.
    protect: () => fixed(value),
  };
}

export function phoneFactory<T extends PhoneLink>(build: (number: string) => T): PhoneFactory<T> {
  function withNumber(input: string, prefix = ''): T {
    const number = phoneNumber(input);
    return build(number.startsWith('+') || !prefix ? number : `+${prefix}${number}`);
  }

  function start(): PhoneStart<T>;
  function start(number: string): T;
  function start(number?: string): PhoneStart<T> | T {
    if (number !== undefined) return withNumber(number);
    return {
      country(country) {
        const prefix = countryCode(country);
        return { number: (input) => withNumber(input, prefix) };
      },
      number: (input) => withNumber(input),
    };
  }

  return start;
}

export function messageFactory(render: (number: string, body: string) => string): PhoneFactory<MessageLink> {
  return phoneFactory((number) => ({
    ...protectable(render(number, '')),
    body: (message = '') => protectable(render(number, message)),
  }));
}

export function queryBody(body: string, key = 'body', separator = '?'): string {
  return body ? `${separator}${key}=${encodeURIComponent(body)}` : '';
}

export function address(value: string): string {
  return encodeURIComponent(value.trim()).replace(/%40/gi, '@').replace(/%2B/gi, '+');
}

export function fixed(value: string): Link {
  return { get: () => value };
}

export function serverLink(input: string, scheme: 'ftp' | 'webcal'): Link {
  const target = input.trim().replace(/^[a-z][a-z\d+.-]*:\/\//i, '').replace(/^\/+/, '');
  const parsed = new URL(`${scheme === 'ftp' ? 'ftp' : 'https'}://${target}`);
  return fixed(parsed.href.replace(/^[a-z]+:/, `${scheme}:`));
}

