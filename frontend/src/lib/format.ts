import type {
  ApiError,
  ApiErrorDetail,
  ReconciliationResult,
} from './api';

export function resultKey(result: ReconciliationResult): string {
  return result.resultId !== undefined
    ? String(result.resultId)
    : `${result.tradeId}-${result.status}`;
}

export function formatTradeId(result: ReconciliationResult): string {
  return result.tradeId || 'Unmatched trade';
}

export function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(' ');
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDecimal(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
  }).format(value);
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatErrorDetail(detail: ApiErrorDetail): string {
  const location = [
    detail.source ? formatStatus(detail.source) : null,
    detail.lineNumber !== undefined ? `line ${detail.lineNumber}` : null,
    detail.field,
  ]
    .filter(Boolean)
    .join(' / ');

  return location ? `${location}: ${detail.message}` : detail.message;
}

export function toDisplayError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      errors: [],
    };
  }

  return {
    message: 'Request failed.',
    errors: [],
  };
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'errors' in error &&
    Array.isArray((error as ApiError).errors)
  );
}
