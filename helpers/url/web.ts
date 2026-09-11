export type UrlProtocol = 'http' | 'https';

export interface UrlChain {
  addPath(path: string): UrlChain;
  addParam(key: string, value?: string): UrlChain;
  get(): string;
}

export interface UrlStart extends UrlChain {
  protocol(protocol: UrlProtocol): UrlChain;
  basePath(path: string): UrlChain;
}

export interface UrlFactory {
  domain(domain: string): UrlStart;
  path(path: string): UrlStart;
}

// Preserve existing escapes while encoding each segment independently of slashes.
function encodePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '').split('/').map((segment) =>
    segment.replace(/%[\da-f]{2}|[^%]+|%/gi, (part) =>
      /^%[\da-f]{2}$/i.test(part) ? part : encodeURIComponent(part),
    ),
  ).join('/');
}

function createUrl(input: string): UrlStart {
  const source = input.trim().replace(/^\/+/, '');
  const explicitProtocol = source.match(/^([a-z][a-z\d+.-]*):\/\//i);

  if (explicitProtocol && !/^https?$/i.test(explicitProtocol[1])) {
    throw new TypeError('URL protocol must be http or https.');
  }

  const parsed = new URL(explicitProtocol ? source : `https://${source}`);
  let scheme: UrlProtocol = parsed.protocol === 'http:' ? 'http' : 'https';
  const paths = [encodePath(parsed.pathname)].filter(Boolean);
  const params = new Map<string, string>();
  parsed.searchParams.forEach((value, key) => params.set(key, value));

  const chain: UrlChain = {
    addPath(path) {
      const fragmentIndex = path.indexOf('#');
      const pathWithQuery = fragmentIndex === -1 ? path : path.slice(0, fragmentIndex);
      if (fragmentIndex !== -1) parsed.hash = path.slice(fragmentIndex);

      const queryIndex = pathWithQuery.indexOf('?');
      const pathname = queryIndex === -1 ? pathWithQuery : pathWithQuery.slice(0, queryIndex);
      const normalized = encodePath(pathname);
      if (normalized) paths.push(normalized);

      if (queryIndex !== -1) {
        new URLSearchParams(pathWithQuery.slice(queryIndex + 1))
          .forEach((value, key) => params.set(key, value));
      }
      return chain;
    },
    addParam(key, value = '') {
      params.set(key, value);
      return chain;
    },
    get() {
      const credentials = parsed.username
        ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ''}@`
        : '';
      const path = paths.length ? `/${paths.join('/')}` : '';
      const query = Array.from(params, ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      ).join('&');
      return `${scheme}://${credentials}${parsed.host}${path}${query ? `?${query}` : ''}${parsed.hash}`;
    },
  };

  return {
    ...chain,
    protocol(protocol) {
      if (protocol !== 'http' && protocol !== 'https') {
        throw new TypeError('URL protocol must be http or https.');
      }
      scheme = protocol;
      return chain;
    },
    basePath(path) {
      return chain.addPath(path);
    },
  };
}

/**
 * Build an absolute HTTP(S) URL. addPath() extracts query parameters and fragments;
 * encoded delimiters such as %3F remain path data. Parameter keys keep their last value.
 */
export const web = Object.assign(
  (): UrlFactory => ({ domain: createUrl, path: createUrl }),
  { domain: createUrl, path: createUrl },
);

export default web;
