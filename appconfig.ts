/**
 * App-level configuration.
 * Single source of truth for domain and base path — used by link helpers
 * so that hard redirects (window.location.href) always resolve correctly.
 */

import { getEnvVariable } from '@/core/helpers/env';
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

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

const CONFIGURED_BASE_PATH =
    getEnvVariable('APP_BASEPATH', true);

export const APP_BASE_PATH = normalizeBasePath(CONFIGURED_BASE_PATH) ?? '';

export const APP_DOMAIN =
    getEnvVariable('APP_DOMAIN', true) ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://neupgroup.com');

/**
 * Returns the base path from APP_BASEPATH, or null when it is unset/empty.
 */
export function getBasePath(): string | null {
    return normalizeBasePath(CONFIGURED_BASE_PATH);
}

/**
 * Returns an app-relative path using the provided base path, or APP_BASEPATH when omitted.
 */
export function makeAppPath(path: string, basePath?: string | null): string {
    const resolvedBasePath = typeof basePath === 'undefined' ? getBasePath() : basePath?.trim() || null;

    if (!resolvedBasePath) {
        return normalizePath(path);
    }

    const normalizedPath = normalizePath(path);

    if (isAbsoluteUrl(resolvedBasePath)) {
        return makeUrl(resolvedBasePath, normalizedPath).toString();
    }

    const normalizedBasePath = normalizeBasePath(resolvedBasePath);
    if (!normalizedBasePath) {
        return normalizedPath;
    }

    const collapsedPath = collapseRepeatedBasePath(normalizedPath, normalizedBasePath);

    if (
        collapsedPath === normalizedBasePath ||
        collapsedPath.startsWith(`${normalizedBasePath}/`)
    ) {
        return collapsedPath;
    }

    const url = makeUrl(`https://app.local${normalizedBasePath}`, collapsedPath);
    return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Returns the full origin + base path when configured, otherwise just the origin.
 */
export function getAppRoot(): string {
    return `${APP_DOMAIN}${getBasePath() ?? ''}`;
}
