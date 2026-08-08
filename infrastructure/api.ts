/*
::neup.documentation::core-infrastructure-api-module
::title API Runner

Shared JSON-oriented API runner.

::public

Use this module to build request URLs and execute API requests without binding
the runner to any endpoint family, service, or product-specific credentials.

::public end

::private

Callers own endpoint paths, base URLs, credentials, and response contracts.

::private end

::end
*/

import { makeUrl, url } from '@/core/helpers/link/url';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiQuery = Record<string, string | number | boolean | null | undefined>;

export type ApiResponse<TBody = unknown> = {
  ok: boolean;
  status: number;
  body: TBody;
  headers: Headers;
};

export type ApiRequestOptions = {
  baseUrl: string;
  path: string;
  method?: ApiMethod;
  query?: ApiQuery;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  headers?: HeadersInit;
  bearerToken?: string | null;
  cookies?: Record<string, string | null | undefined>;
  cache?: RequestCache;
};

/**
 * ::neup.documentation::core-infrastructure-api-create-url
 * ::function createApiUrl(baseUrl, path, query)
 *
 * Builds an absolute API URL from a base URL and path.
 *
 * ::public
 *
 * Query parameters with `null`, `undefined`, or empty-string values are omitted.
 *
 * ::public end
 *
 * ::end
 */
export function createApiUrl(baseUrl: string, path: string, query?: ApiQuery): string {
  const nextUrl = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(path)
    ? url(path)
    : makeUrl(baseUrl, path);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      nextUrl.addParams(key, value);
    }
  }

  return nextUrl.get();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function applyCookieHeaders(headers: Headers, cookies?: ApiRequestOptions['cookies']) {
  if (!cookies) return;

  const nextCookies = Object.entries(cookies)
    .map(([name, value]) => {
      const cookieValue = value?.trim();
      return cookieValue ? `${name}=${cookieValue}` : null;
    })
    .filter((cookie): cookie is string => Boolean(cookie));

  if (nextCookies.length === 0) return;

  const existingCookie = headers.get('cookie')?.trim();
  headers.set('cookie', [existingCookie, ...nextCookies].filter(Boolean).join('; '));
}

async function parseApiResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => '');
}

/**
 * ::neup.documentation::core-infrastructure-api-run
 * ::function runApi(options)
 *
 * Executes one API request and returns the parsed response.
 *
 * ::public
 *
 * JSON objects and arrays are stringified automatically and sent with
 * `content-type: application/json`.
 *
 * ::public end
 *
 * ::end
 */
export async function runApi<TBody = unknown>(
  options: ApiRequestOptions,
): Promise<ApiResponse<TBody>> {
  const method = options.method ?? 'GET';
  const url = createApiUrl(options.baseUrl, options.path, options.query);
  const headers = new Headers(options.headers);

  if (options.bearerToken?.trim()) {
    headers.set('authorization', `Bearer ${options.bearerToken.trim()}`);
  }

  applyCookieHeaders(headers, options.cookies);

  let requestBody: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null) {
    if (Array.isArray(options.body) || isPlainObject(options.body)) {
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      requestBody = JSON.stringify(options.body);
    } else {
      requestBody = options.body;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody,
    cache: options.cache ?? 'no-store',
  });

  const body = (await parseApiResponseBody(response)) as TBody;

  return {
    ok: response.ok,
    status: response.status,
    body,
    headers: response.headers,
  };
}
