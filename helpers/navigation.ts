/*
::neup.documentation::core-navigation-helpers
::title Navigation Helpers

Client-side navigation helpers for in-app redirects, sticky query preservation, and back-history navigation.

::public

Use `redirectInApp`, `redirectInDomain`, `redirectHttps`, and `redirectHttp` for client navigation. Use `writeHistory`, `readHistory`, `hasBackHistory`, and `goBack` to track and resolve in-app back navigation through session storage.

::public end

::private

Back-navigation history is stored in browser session storage under `back:history`, and `goBack()` removes the current entry before navigating to the previous recorded URL.

::private end

::end
*/

type RouterNavigationOptions = {
  scroll?: boolean;
};

type AppRouterLike = {
  push: (href: string, options?: RouterNavigationOptions) => void;
  replace: (href: string, options?: RouterNavigationOptions) => void;
};

type AppRedirectOptions = RouterNavigationOptions & {
  replace?: boolean;
  preserveFlowParams?: boolean; // Whether to preserve backsTo and steps params (default: true)
};

type BrowserRedirectOptions = {
  replace?: boolean;
  preserveFlowParams?: boolean; // Whether to preserve backsTo and steps params (default: true)
};

const STICKY_QUERY_KEYS = ['workingProfile'] as const;
const FLOW_QUERY_KEYS = ['backs', 'backsTo', 'steps'] as const;
const BACK_HISTORY_STORAGE_KEY = 'back:history';
const MAX_HISTORY_ENTRIES = 50;

type FlowParams = Partial<Record<(typeof FLOW_QUERY_KEYS)[number], string>>;

function splitHref(href: string) {
  const hashIndex = href.indexOf('#');
  const beforeHash = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : href.slice(hashIndex);
  const queryIndex = beforeHash.indexOf('?');

  return {
    basePath: queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex),
    query: queryIndex === -1 ? '' : beforeHash.slice(queryIndex + 1),
    hash,
  };
}

export function getFlowParams(params: URLSearchParams): FlowParams {
  const flowParams: FlowParams = {};

  for (const key of FLOW_QUERY_KEYS) {
    const value = params.get(key);
    if (value) {
      flowParams[key] = value;
    }
  }

  return flowParams;
}

export function appendFlowParamsObject(href: string, flowParams: FlowParams): string {
  const { basePath, query, hash } = splitHref(href);
  const nextParams = new URLSearchParams(query);

  for (const key of FLOW_QUERY_KEYS) {
    const value = flowParams[key];
    if (value && !nextParams.has(key)) {
      nextParams.set(key, value);
    }
  }

  const nextQuery = nextParams.toString();
  return `${basePath}${nextQuery ? `?${nextQuery}` : ''}${hash}`;
}

function getCurrentInAppUrl() {
  if (typeof window === 'undefined') return '/';
  return window.location.href;
}

function normalizeHistoryEntry(entry: unknown): string | null {
  if (typeof entry !== 'string') return null;
  const normalized = entry.trim();
  if (!normalized) return null;

  if (typeof window === 'undefined') {
    return normalized;
  }

  try {
    return new URL(normalized, window.location.href).toString();
  } catch {
    return null;
  }
}

function persistHistory(history: string[]) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(BACK_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore sessionStorage write failures.
  }
}

function mergeBackParams(
  targetPath: string,
  withParam: boolean,
  withAllParam: boolean,
  withWhatParams: string[],
) {
  if (!withParam || typeof window === 'undefined') {
    return targetPath;
  }

  const currentUrl = new URL(window.location.href);
  const targetUrl = new URL(targetPath, window.location.origin);

  if (withAllParam) {
    currentUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });
  } else {
    withWhatParams.forEach((key) => {
      const value = currentUrl.searchParams.get(key);
      if (value !== null) {
        targetUrl.searchParams.set(key, value);
      }
    });
  }

  return targetUrl.toString();
}

export function appendStickyQueryParams(targetHref: string, currentParams: URLSearchParams) {
  const { basePath, query, hash } = splitHref(targetHref);
  const nextParams = new URLSearchParams(query);

  for (const key of STICKY_QUERY_KEYS) {
    const value = currentParams.get(key);
    if (value && !nextParams.has(key)) {
      nextParams.set(key, value);
    }
  }

  const nextQuery = nextParams.toString();
  return `${basePath}${nextQuery ? `?${nextQuery}` : ''}${hash}`;
}

export function readHistory(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.sessionStorage.getItem(BACK_HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeHistoryEntry)
      .filter((entry): entry is string => Boolean(entry));
  } catch {
    return [];
  }
}

export function writeHistory(path?: string) {
  if (typeof window === 'undefined') return;

  const nextPath = normalizeHistoryEntry(path ?? getCurrentInAppUrl());
  if (!nextPath) return;

  const history = readHistory();
  if (history[history.length - 1] === nextPath) return;

  persistHistory([...history, nextPath].slice(-MAX_HISTORY_ENTRIES));
}

export function hasBackHistory(): boolean {
  return readHistory().length > 1;
}

export function goBack(
  withParam: boolean,
  withAllParam: boolean = true,
  withWhatParams: string[] = [],
): boolean {
  if (typeof window === 'undefined') return false;

  const history = readHistory();
  if (history.length < 2) {
    return false;
  }

  const updatedHistory = history.slice(0, -1);
  const previousPath = updatedHistory[updatedHistory.length - 1];
  if (!previousPath) {
    return false;
  }

  persistHistory(updatedHistory);

  const finalPath = mergeBackParams(previousPath, withParam, withAllParam, withWhatParams);
  window.location.assign(finalPath);
  return true;
}

// Performs a hard browser navigation using window.location.
function navigateInBrowser(targetUrl: string, options: BrowserRedirectOptions = {}) {
  if (typeof window === 'undefined') return;

  let finalUrl = targetUrl;
  const currentParams = new URLSearchParams(window.location.search);

  // Preserve backsTo and steps params if requested (default: true)
  const shouldPreserve = options.preserveFlowParams !== false;
  if (shouldPreserve) {
    const flowParams = getFlowParams(currentParams);
    finalUrl = appendFlowParamsObject(targetUrl, flowParams);
  }

  finalUrl = appendStickyQueryParams(finalUrl, currentParams);

  if (options.replace) {
    window.location.replace(finalUrl);
    return;
  }

  window.location.assign(finalUrl);
}

// Normalizes a value into an absolute URL string using the given protocol as fallback.
// Handles protocol-relative URLs (//example.com) and bare hostnames.
function normalizeAbsoluteUrl(value: string, defaultProtocol: 'http:' | 'https:') {
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
    return new URL(value).toString();
  }

  if (value.startsWith('//')) {
    return new URL(`${defaultProtocol}${value}`).toString();
  }

  return new URL(`${defaultProtocol}//${value}`).toString();
}

// Navigates within the app using the Next.js router.
// Supports push (default) or replace, and optional scroll control.
// By default, preserves backsTo and steps params from the current URL.
export function redirectInApp(router: AppRouterLike, href: string, options: AppRedirectOptions = {}) {
  const { replace = false, scroll, preserveFlowParams = true } = options;
  const navigationOptions = scroll === undefined ? undefined : { scroll };

  let finalHref = href;
  const currentParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  // Preserve backsTo and steps params if requested (default: true)
  if (preserveFlowParams && currentParams) {
    const flowParams = getFlowParams(currentParams);
    finalHref = appendFlowParamsObject(href, flowParams);
  }

  if (currentParams) {
    finalHref = appendStickyQueryParams(finalHref, currentParams);
  }

  if (replace) {
    router.replace(finalHref, navigationOptions);
    return;
  }

  router.push(finalHref, navigationOptions);
}

// Performs a hard navigation to a same-origin path or URL.
// Throws if the target resolves to a different origin.
export function redirectInDomain(pathOrUrl: string, options: BrowserRedirectOptions = {}) {
  if (typeof window === 'undefined') return;

  const targetUrl = new URL(pathOrUrl, window.location.origin);

  if (targetUrl.origin !== window.location.origin) {
    throw new Error(`redirectInDomain only supports same-domain URLs. Received: ${pathOrUrl}`);
  }

  navigateInBrowser(targetUrl.toString(), options);
}

// Navigates to an external HTTPS URL.
export function redirectHttps(value: string, options: BrowserRedirectOptions = {}) {
  navigateInBrowser(normalizeAbsoluteUrl(value, 'https:'), options);
}

// Navigates to an external HTTP URL.
export function redirectHttp(value: string, options: BrowserRedirectOptions = {}) {
  navigateInBrowser(normalizeAbsoluteUrl(value, 'http:'), options);
}

// Builds a URL that preserves backsTo and steps flow params.
// Use this for generating href attributes on anchor tags or links that might be opened in new tabs.
export function buildHrefWithFlowParams(href: string): string {
  if (typeof window === 'undefined') return href;

  const currentParams = new URLSearchParams(window.location.search);
  const flowParams = getFlowParams(currentParams);

  return appendFlowParamsObject(href, flowParams);
}
