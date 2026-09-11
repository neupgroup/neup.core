/** Response-stage API types and the execution-only fluent runner. */
export type ApiResponse<TBody = unknown> = { ok: boolean; status: number; body: TBody; headers: Headers };


export class Runner {
  constructor(private readonly execute: () => Promise<ApiResponse>) {}
  private response?: ApiResponse;
  /** Executes the prepared request and stores its response for later calls. */
  async run(): Promise<this> { this.response = await this.execute(); return this; }

  /** Logs the stored response; execution must already have happened. */
  async log(): Promise<this> {
    if (!this.response) throw new Error('Call run() before log().');
    console.log(this.response);
    return this;
  }

  /** Returns the stored response; execution must already have happened. */
  getResponse<TBody = unknown>(): ApiResponse<TBody> {
    if (!this.response) throw new Error('Call run() before getResponse().');
    return this.response as ApiResponse<TBody>;
  }
}
