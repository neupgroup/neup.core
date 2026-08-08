/**
 * App-level configuration.
 * Single source of truth for domain and base path — used by link helpers
 * so that hard redirects (window.location.href) always resolve correctly.
 */

function normalizeBasePath(value: string | undefined): string | null {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function normalizePath(path: string): string {
    if (!path) return '/';
    return path.startsWith('/') ? path : `/${path}`;
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
    const resolvedBasePath =
        typeof basePath === 'undefined'
            ? getBasePath()
            : normalizeBasePath(basePath ?? undefined);

    return resolvedBasePath ? `${resolvedBasePath}${normalizedPath}` : normalizedPath;
}

/**
 * Returns the full origin + base path when configured, otherwise just the origin.
 */
export function getAppRoot(): string {
    return `${APP_DOMAIN}${getBasePath() ?? ''}`;
}
