/**
 * App-level configuration.
 * Single source of truth for domain and base path — used by link helpers
 * so that hard redirects (window.location.href) always resolve correctly.
 */

import { makeUrl } from '@/core/helpers/link/url';

function normalizeBasePath(value: string | undefined): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    const normalizedValue = (() => {
        try {
            if (/^https?:\/\//i.test(trimmed)) {
                return new URL(trimmed).pathname;
            }
        } catch {
            return trimmed;
        }

        return trimmed;
    })();

    const withoutTrailingSlash = normalizedValue.replace(/\/+$/, '');
    if (!withoutTrailingSlash || withoutTrailingSlash === '/') return null;

    return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
}

function normalizePath(path: string): string {
    if (!path) return '/';
    return path.startsWith('/') ? path : `/${path}`;
}

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

export const APP_BASE_PATH = normalizeBasePath(process.env.APP_BASEPATH) ?? '';

export const APP_DOMAIN =
    process.env.NEXT_PUBLIC_APP_DOMAIN ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://neupgroup.com');

/**
 * Returns the base path from APP_BASEPATH, or null when it is unset/empty.
 */
export function getBasePath(): string | null {
    return normalizeBasePath(process.env.APP_BASEPATH);
}

/**
 * Returns an app-relative path using the provided base path, or APP_BASEPATH when omitted.
 */
export function makeAppPath(path: string, basePath?: string | null): string {
    const normalizedPath = normalizePath(path);
    const resolvedBasePath = typeof basePath === 'undefined' ? getBasePath() : basePath?.trim() || null;

    if (!resolvedBasePath) {
        return normalizedPath;
    }

    if (isAbsoluteUrl(resolvedBasePath)) {
        return makeUrl(resolvedBasePath, normalizedPath).toString();
    }

    const normalizedBasePath = normalizeBasePath(resolvedBasePath);
    if (!normalizedBasePath) {
        return normalizedPath;
    }

    const url = makeUrl(`https://app.local${normalizedBasePath}`, normalizedPath);
    return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Returns the full origin + base path when configured, otherwise just the origin.
 */
export function getAppRoot(): string {
    return `${APP_DOMAIN}${getBasePath() ?? ''}`;
}
