/*
::neup.documentation::core-helper-url
::title URL Helper

Shared helpers for request URL construction, URL query extraction, request protocol checks, and user-entered URL normalization.

::public

Use `normalizeUrl()` for persisted profile or asset URLs that may be entered without a protocol.

Use `makeUrl()` to combine a base URL and endpoint while preserving the base
path by default.

Use `buildPublicAppUrl()` and `getPublicAppOrigin()` for public app URLs derived from request headers.

::public end

::private

`normalizeUrl()` does not modify root-relative paths or values that already include a URI scheme.

::private end

::end
*/

type RequestLike = {
  url?: string;
  nextUrl?: { href?: string; origin?: string; protocol?: string };
  headers?: { get(name: string): string | null };
};

type UrlParamValue = string | number | boolean | null | undefined;

const DEFAULT_BASE_PATH =
  process.env.NEXT_PUBLIC_APP_BASEPATH ??
  process.env.APP_BASEPATH ??
  '/analytics';
const DEFAULT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? `https://neupgroup.com${DEFAULT_BASE_PATH}`;

function normalizeBasePath(basePath: string): string {
  if (!basePath) return '';
  return basePath.startsWith('/') ? basePath.replace(/\/$/, '') : `/${basePath.replace(/\/$/, '')}`;
}

function normalizeCustomPath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function isAbsoluteUrl(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value);
}

function combineRelativePaths(basePath: string, customPath: string): string {
  const url = makeUrl(`https://app.local${normalizeBasePath(basePath)}`, normalizeCustomPath(customPath));
  return `${url.pathname}${url.search}${url.hash}`;
}

function collapseRepeatedBasePath(path: string, basePath: string): string {
  if (!basePath) return path;

  let collapsedPath = path;
  const repeatedBasePath = `${basePath}${basePath}`;

  while (
    collapsedPath === repeatedBasePath ||
    collapsedPath.startsWith(`${repeatedBasePath}/`) ||
    collapsedPath.startsWith(`${repeatedBasePath}?`) ||
    collapsedPath.startsWith(`${repeatedBasePath}#`)
  ) {
    collapsedPath = `${basePath}${collapsedPath.slice(repeatedBasePath.length)}`;
  }

  return collapsedPath;
}

function applyDefaultBasePath(path: string): string {
  const normalizedDefaultBasePath = normalizeBasePath(DEFAULT_BASE_PATH);
  const normalizedPath = collapseRepeatedBasePath(
    normalizeCustomPath(path),
    normalizedDefaultBasePath
  );

  if (!normalizedDefaultBasePath) {
    return normalizedPath;
  }

  if (
    normalizedPath === normalizedDefaultBasePath ||
    normalizedPath.startsWith(`${normalizedDefaultBasePath}/`)
  ) {
    return normalizedPath;
  }

  return combineRelativePaths(normalizedDefaultBasePath, normalizedPath);
}

function getForwardedValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.split(',')[0]?.trim() || null;
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
}

/**
 * ::neup.documentation::core-helper-url-make-url
 * ::function makeUrl(basePath, endpoint, preservePath, preserveParameters)
 *
 * Builds a URL from a base URL and endpoint.
 *
 * ::public
 *
 * `preservePath` defaults to `true`, so base paths such as `/estate` are kept
 * when the endpoint starts with `/`.
 *
 * `preserveParameters` defaults to `false`. When set to `true`, query
 * parameters from the base URL are preserved and endpoint parameters override
 * matching base parameters.
 *
 * ::public end
 *
 * ::end
 */
export function makeUrl(
  basePath: string,
  endpoint: string,
  preservePath = true,
  preserveParameters = false,
): URL {
  const baseUrl = new URL(basePath);
  const endpointUrl = new URL(endpoint, baseUrl.origin);
  const baseUrlPath = preservePath ? baseUrl.pathname.replace(/\/+$/, '') : '';
  const endpointPath = endpointUrl.pathname.replace(/^\/+/, '');

  baseUrl.pathname = [baseUrlPath, endpointPath].filter(Boolean).join('/');

  const nextSearchParams = new URLSearchParams();
  if (preserveParameters) {
    for (const [key, value] of baseUrl.searchParams.entries()) {
      nextSearchParams.append(key, value);
    }
  }

  for (const [key, value] of endpointUrl.searchParams.entries()) {
    nextSearchParams.set(key, value);
  }

  baseUrl.search = nextSearchParams.toString();
  baseUrl.hash = endpointUrl.hash;

  return baseUrl;
}

export class UrlBuilder {
  private readonly initialValue: string | null;
  private basePath: string | null;
  private customPath: string | null;
  private readonly params = new URLSearchParams();
  private hasSetBasePath = false;
  private hasAddedCustomPath = false;
  private hasResolved = false;

  constructor(path?: string, base?: string) {
    this.initialValue = path?.trim() || null;
    this.basePath = base?.trim() || null;
    this.customPath = null;

    if (this.initialValue && !isAbsoluteUrl(this.initialValue) && !this.basePath) {
      this.customPath = this.initialValue;
    }
  }

  setBasePath(basePath: string | null | undefined): this {
    if (this.hasSetBasePath) {
      throw new Error('setBasePath() can only be called once per url() builder.');
    }

    this.hasSetBasePath = true;
    const trimmed = basePath?.trim();
    this.basePath = trimmed || null;
    return this;
  }

  addCustomPath(path: string | null | undefined): this {
    if (this.hasAddedCustomPath) {
      throw new Error('addCustomPath() can only be called once per url() builder.');
    }

    this.hasAddedCustomPath = true;
    const trimmed = path?.trim();
    if (!trimmed) return this;

    this.customPath = this.customPath
      ? combineRelativePaths(this.customPath, trimmed)
      : normalizeCustomPath(trimmed);

    return this;
  }

  addParam(name: string, value: UrlParamValue): this {
    if (value === null || value === undefined || value === '') {
      return this;
    }

    this.params.set(name, String(value));
    return this;
  }

  addParams(name: string, value: UrlParamValue): this {
    return this.addParam(name, value);
  }

  removeParam(name: string): this {
    this.params.delete(name);
    return this;
  }

  toURL(): URL {
    const resolvedValue = this.resolveValue();
    const nextUrl = isAbsoluteUrl(resolvedValue)
      ? new URL(resolvedValue)
      : new URL(resolvedValue, 'https://app.local');

    for (const [key, value] of this.params.entries()) {
      nextUrl.searchParams.set(key, value);
    }

    return nextUrl;
  }

  toString(): string {
    return this.get();
  }

  get(): string {
    if (this.hasResolved) {
      throw new Error('get() can only be called once per url() builder.');
    }

    this.hasResolved = true;
    const nextUrl = this.toURL();
    const resolvedValue = this.resolveValue();

    if (isAbsoluteUrl(resolvedValue)) {
      return nextUrl.toString();
    }

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  }

  private resolveValue(): string {
    if (this.initialValue && isAbsoluteUrl(this.initialValue)) {
      return this.customPath
        ? makeUrl(this.initialValue, this.customPath).toString()
        : this.initialValue;
    }

    if (this.basePath && isAbsoluteUrl(this.basePath)) {
      return makeUrl(this.basePath, this.customPath ?? this.initialValue ?? '/').toString();
    }

    if (this.basePath) {
      return combineRelativePaths(this.basePath, this.customPath ?? this.initialValue ?? '/');
    }

    if (this.customPath) {
      return applyDefaultBasePath(this.customPath);
    }

    if (this.initialValue) {
      return applyDefaultBasePath(this.initialValue);
    }

    return applyDefaultBasePath('/');
  }
}

export function url(path?: string, base?: string): UrlBuilder {
  return new UrlBuilder(path, base);
}

export function getPublicAppOrigin(request?: RequestLike): string {
  const forwardedHost = getForwardedValue(request?.headers?.get('x-forwarded-host'));
  const host = forwardedHost ?? getForwardedValue(request?.headers?.get('host'));
  const forwardedProto = getForwardedValue(request?.headers?.get('x-forwarded-proto'));
  const proto =
    forwardedProto ??
    request?.nextUrl?.protocol?.replace(':', '') ??
    (request?.url ? new URL(request.url).protocol.replace(':', '') : null) ??
    'https';

  if (host) {
    return `${proto}://${host}`;
  }

  if (request?.nextUrl?.origin && !request.nextUrl.origin.includes('localhost')) {
    return request.nextUrl.origin;
  }

  if (request?.url) {
    return new URL(request.url).origin;
  }

  return new URL(DEFAULT_PUBLIC_BASE_URL).origin;
}

export function buildPublicAppUrl(request: RequestLike | undefined, pathnameWithSearch: string): string {
  const origin = getPublicAppOrigin(request);
  const basePath = normalizeBasePath(DEFAULT_BASE_PATH);
  const suffix = pathnameWithSearch.startsWith('/') ? pathnameWithSearch : `/${pathnameWithSearch}`;
  const targetPath = suffix === basePath || suffix.startsWith(`${basePath}/`) ? suffix : `${basePath}${suffix}`;
  return new URL(targetPath, origin).toString();
}

function normalizeParamValue(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getParamHeaderCandidates(name: string): string[] {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return [];
  }

  const kebabName = normalizedName.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

  return [`x-${kebabName}`, `x-url-param-${kebabName}`, `x-query-${kebabName}`];
}

export async function getUrlParam(
  name: string,
  explicitValue?: string | null,
): Promise<string | null> {
  const normalizedExplicitValue = normalizeParamValue(explicitValue);
  if (normalizedExplicitValue) {
    return normalizedExplicitValue;
  }

  const { headers } = await import('next/headers');
  const requestHeaders = await headers();

  for (const headerName of getParamHeaderCandidates(name)) {
    const headerValue = normalizeParamValue(requestHeaders.get(headerName));
    if (headerValue) {
      return headerValue;
    }
  }

  return null;
}

export async function getUrlParams(
  definitions: Record<string, string | null | undefined> = {},
): Promise<Record<string, string | null>> {
  const entries = await Promise.all(
    Object.entries(definitions).map(async ([key, value]) => [key, await getUrlParam(key, value)] as const),
  );

  return Object.fromEntries(entries);
}

export async function getRequestProtocol(): Promise<'http' | 'https'> {
  const { headers } = await import('next/headers');
  const requestHeaders = await headers();
  const forwardedProto = normalizeParamValue(requestHeaders.get('x-forwarded-proto'));

  if (forwardedProto?.toLowerCase() === 'http') {
    return 'http';
  }

  return 'https';
}

export async function isHttpsRequest(): Promise<boolean> {
  return (await getRequestProtocol()) === 'https';
}
