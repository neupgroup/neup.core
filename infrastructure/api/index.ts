/**
 * Fluent API request entry point.
 *
 * The builder configures and executes a request through a single run() call.
 */
import { addFormData, addFormDataRaw, addHeader, getBody, type BodyState } from './body';
import { Fallback } from './fallback';
import { parseResponse } from './response';
import { Runner, type ApiResponse } from './runner';


export { Runner, type ApiResponse } from './runner';
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export const GET: ApiMethod = 'GET';
export const POST: ApiMethod = 'POST';
export const PUT: ApiMethod = 'PUT';
export const PATCH: ApiMethod = 'PATCH';
export const DELETE: ApiMethod = 'DELETE';


export type ApiQuery = Record<string, string | number | boolean | null | undefined>;
export type ApiRequestOptions = { baseUrl: string; path: string; method?: ApiMethod; query?: ApiQuery; body?: BodyInit | Record<string, unknown> | unknown[] | null; headers?: HeadersInit; bearerToken?: string | null; cookies?: Record<string, string | null | undefined> };
export function createApiUrl(baseUrl: string, path: string, query?: ApiQuery): string {
  // URL handles absolute paths and safely encodes query parameter values.
  const result = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  for (const [key, value] of Object.entries(query ?? {})) if (value !== null && value !== undefined && value !== '') result.searchParams.set(key, String(value));
  return result.toString();
}


export class Api extends Fallback {
  private path?: string;
  private method: ApiMethod = GET;
  private body: BodyState = { headers: new Headers(), form: [] };
  /** Sets the complete request URL. */
  atPath(path: string): this { this.path = path; return this; }
  /** Selects the HTTP method used by fetch(). */
  usingMethod(method: ApiMethod): this { this.method = method; return this; }
  /** Sets a raw request body. */
  addData(data: string): this { this.body.data = data; return this; }
  /** Adds one request header. */
  addHeader(value: string): this { addHeader(this.body, value); return this; }
  /** Adds one form-data field. */
  addFormData(key: string, value: string): this { addFormData(this.body, key, value); return this; }
  /** Adds a raw "key=value" form-data field. */
  addFormDataRaw(value: string): this { addFormDataRaw(this.body, value); return this; }
  /** Executes the configured request. */
  async run(): Promise<ApiResponse> {
    if (!this.path) throw new Error('API path has not been set.');
    const response = await fetch(this.path, { method: this.method, headers: this.body.headers, body: getBody(this.body), cache: 'no-store' });
    const parsed = await parseResponse(response);
    if (this.shouldFailOnError && !parsed.ok) throw new Error(`API request failed with status ${parsed.status}: ${JSON.stringify(parsed.body)}`);
    return parsed;
  }
}


export const api = new Api();


/** Compatibility adapter for endpoint modules that still use the old API. */
export async function runApi<TBody = unknown>(options: ApiRequestOptions): Promise<ApiResponse<TBody>> {
  const request = new Api().atPath(createApiUrl(options.baseUrl, options.path, options.query));
  if (options.method) request.usingMethod(options.method);
  if (options.body !== undefined && options.body !== null) request.addData(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
  for (const [key, value] of new Headers(options.headers).entries()) request.addHeader(`${key}: ${value}`);
  if (options.bearerToken) request.addHeader(`authorization: Bearer ${options.bearerToken}`);
  if (options.cookies) request.addHeader(`cookie: ${Object.entries(options.cookies).filter(([, value]) => value).map(([key, value]) => `${key}=${value}`).join('; ')}`);
  return (await request.run()) as ApiResponse<TBody>;
}
