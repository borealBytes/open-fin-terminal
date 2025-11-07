/**
 * Custom error class for OpenBB Platform API errors
 */

export class OpenBBError extends Error {
  public readonly status?: number;
  public readonly provider?: string;
  public readonly endpoint?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      provider?: string;
      endpoint?: string;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = 'OpenBBError';
    this.status = options?.status;
    this.provider = options?.provider;
    this.endpoint = options?.endpoint;
    this.details = options?.details;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OpenBBError);
    }
  }

  /**
   * Create error from HTTP response
   */
  static fromResponse(response: Response, endpoint?: string): OpenBBError {
    return new OpenBBError(
      `OpenBB API request failed: ${response.statusText}`,
      {
        status: response.status,
        endpoint,
      }
    );
  }

  /**
   * Create error for network failures
   */
  static networkError(endpoint: string, cause: unknown): OpenBBError {
    return new OpenBBError(`Network error accessing OpenBB API`, {
      endpoint,
      details: cause,
    });
  }

  /**
   * Create error for validation failures
   */
  static validationError(endpoint: string, details: unknown): OpenBBError {
    return new OpenBBError(`Response validation failed for ${endpoint}`, {
      endpoint,
      details,
    });
  }

  /**
   * Create error for provider failures
   */
  static providerError(provider: string, message: string): OpenBBError {
    return new OpenBBError(`Provider ${provider} error: ${message}`, {
      provider,
    });
  }
}
