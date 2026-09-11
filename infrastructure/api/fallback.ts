/** Configuration shared by the request-building stage and response runner. */
export class Fallback {
  protected shouldFailOnError = false;

  
  /** Controls whether non-2xx responses reject the request execution. */
  failOnError(value: boolean): this { this.shouldFailOnError = value; return this; }
}
