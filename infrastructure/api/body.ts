/**
 * Request body state and helpers.
 *
 * This module owns raw data, headers, and form-data construction before a
 * request is handed to the runner.
 */
export type BodyState = { data?: string; headers: Headers; form: Array<[string, string]> };


/** Adds a header supplied in "name: value" or "name=value" format. */
export function addHeader(state: BodyState, value: string): void {
  const index = value.includes(':') ? value.indexOf(':') : value.indexOf('=');
  if (index < 1) throw new Error('Header must be formatted as "name: value".');
  state.headers.set(value.slice(0, index).trim(), value.slice(index + 1).trim());
}


/** Adds one URL-encoded form field to the pending request. */
export function addFormData(state: BodyState, key: string, value: string): void { state.form.push([key, value]); }

/** Parses and adds one raw "key=value" form field. */
export function addFormDataRaw(state: BodyState, value: string): void {
  const index = value.indexOf('=');
  if (index < 1) throw new Error('Raw form data must be formatted as "key=value".');
  addFormData(state, value.slice(0, index), value.slice(index + 1));
}


/** Converts the configured body state into the value accepted by fetch(). */
export function getBody(state: BodyState): BodyInit | undefined {
  if (!state.form.length) return state.data;
  // URLSearchParams performs the required form-value escaping.
  const body = new URLSearchParams();
  for (const [key, value] of state.form) body.append(key, value);
  if (!state.headers.has('content-type')) state.headers.set('content-type', 'application/x-www-form-urlencoded');
  return body;
}
