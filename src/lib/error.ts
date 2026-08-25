export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

export interface AppErrorDetail {
  code: string;
  message: string;
  severity: ErrorSeverity;
  source?: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  remediation?: string;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly source?: string;
  public readonly location?: {
    file?: string;
    line?: number;
    column?: number;
  };
  public readonly remediation?: string;

  constructor(detail: AppErrorDetail) {
    super(detail.message);
    this.name = 'AppError';
    this.code = detail.code;
    this.severity = detail.severity;
    this.source = detail.source;
    this.location = detail.location;
    this.remediation = detail.remediation;
  }

  public static fromError(err: unknown, fallbackCode = 'ERR_UNKNOWN', fallbackMessage = 'An unexpected error occurred'): AppError {
    if (err instanceof AppError) {
      return err;
    }
    if (err instanceof Error) {
      return new AppError({
        code: fallbackCode,
        message: err.message,
        severity: 'error',
        cause: err,
      });
    }
    return new AppError({
      code: fallbackCode,
      message: typeof err === 'string' ? err : fallbackMessage,
      severity: 'error',
      cause: err,
    });
  }
}
