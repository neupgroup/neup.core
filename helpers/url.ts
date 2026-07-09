import { headers } from 'next/headers';

type RequestLike = {
  url?: string;
  nextUrl?: { href?: string; origin?: string; protocol?: string };
  headers?: { get(name: string): string | null };
};

const DEFAULT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://neupgroup.com/estate';
const DEFAULT_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/estate';

function normalizeBasePath(basePath: string): string {
  if (!basePath) return '';
  return basePath.startsWith('/') ? basePath.replace(/\/$/, '') : `/${basePath.replace(/\/$/, '')}`;
}

function getForwardedValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.split(',')[0]?.trim() || null;
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
