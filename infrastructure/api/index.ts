export const GET = 'GET' as const;
export const POST = 'POST' as const;
export const PUT = 'PUT' as const;
export const PATCH = 'PATCH' as const;
export const DELETE = 'DELETE' as const;

export type ApiMethod = typeof GET | typeof POST | typeof PUT | typeof PATCH | typeof DELETE;
export type ApiResponse<TBody = unknown> = { ok: boolean; status: number; body: TBody; headers: Headers };
type FormEntry = { key: string; value: string };

async function parseBody(response: Response): Promise<unknown> {
  const type = response.headers.get('content-type')?.toLowerCase() ?? '';
  return type.includes('application/json') ? response.json().catch(() => null) : response.text().catch(() => '');
}

export class Api {
  private path?: string;
  private method: ApiMethod = GET;
  private data?: BodyInit;
  private headers = new Headers();
  private formData: FormEntry[] = [];
  private shouldFailOnError = false;
  private response?: ApiResponse;

  atPath(path: string): this { this.path = path; return this; }
  usingMethod(method: ApiMethod): this { this.method = method; return this; }
  addData(data: string): this { this.data = data; return this; }

  /** Accepts "name: value" or "name=value". */
  addHeader(header: string): this {
    const separator = header.includes(':') ? ':' : '=';
    const index = header.indexOf(separator);
    if (index < 1) throw new Error('Header must be formatted as "name: value".');
    this.headers.set(header.slice(0, index).trim(), header.slice(index + 1).trim());
    return this;
  }

  addFormData(key: string, value: string): this { this.formData.push({ key, value }); return this; }
  addFormDataRaw(value: string): this {
    const index = value.indexOf('=');
    if (index < 1) throw new Error('Raw form data must be formatted as "key=value".');
    return this.addFormData(value.slice(0, index), value.slice(index + 1));
  }
  failOnError(value: boolean): this { this.shouldFailOnError = value; return this; }

  async run(): Promise<this> {
    if (!this.path) throw new Error('API path has not been set.');
    let body = this.data;
    if (this.formData.length) {
      const params = new URLSearchParams();
      for (const entry of this.formData) params.append(entry.key, entry.value);
      body = params;
      if (!this.headers.has('content-type')) this.headers.set('content-type', 'application/x-www-form-urlencoded');
    }
    const result = await fetch(this.path, { method: this.method, headers: this.headers, body, cache: 'no-store' });
    this.response = { ok: result.ok, status: result.status, body: await parseBody(result), headers: result.headers };
    if (this.shouldFailOnError && !result.ok) {
      throw new Error(`API request failed with status ${result.status}: ${JSON.stringify(this.response.body)}`);
    }
    return this;
  }

  async log(): Promise<this> { if (!this.response) await this.run(); console.log(this.response); return this; }
  getResponse<TBody = unknown>(): ApiResponse<TBody> | undefined { return this.response as ApiResponse<TBody> | undefined; }
}

export const api = new Api();
