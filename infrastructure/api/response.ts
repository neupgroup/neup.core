/** Converts a fetch Response into the API response shape used by Runner. */
import type { ApiResponse } from './runner';

/** Parses JSON responses as objects and all other responses as text. */
export async function parseResponse(response: Response): Promise<ApiResponse> {
  const type = response.headers.get('content-type')?.toLowerCase() ?? '';
  // Invalid JSON should not hide the HTTP status; represent it as null.
  const body = type.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => '');
  return { ok: response.ok, status: response.status, body, headers: response.headers };
}
