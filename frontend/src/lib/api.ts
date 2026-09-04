export type ReconciliationStatus =
  | 'MATCHED'
  | 'MISSING_INTERNAL'
  | 'MISSING_EXTERNAL'
  | 'PRICE_MISMATCH'
  | 'QUANTITY_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'DUPLICATE';

export type ResolutionStatus = 'OPEN' | 'RESOLVED' | 'IGNORED';

export type Trade = {
  source: 'INTERNAL' | 'EXTERNAL';
  tradeId: string;
  symbol: string;
  quantity: number;
  price: number;
  currency: string;
  tradeDate: string;
};

export type ReconciliationResult = {
  resultId?: number;
  tradeId: string;
  status: ReconciliationStatus;
  description: string;
  createdAt?: string;
  internalTrades: Trade[];
  externalTrades: Trade[];
  latestResolution?: ExceptionResolutionResponse | null;
};

export type ReconciliationRun = {
  runId: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt: string | null;
  internalTradeCount: number;
  externalTradeCount: number;
  matchedCount: number;
  exceptionCount: number;
};

export type CreateReconciliationResponse = ReconciliationRun & {
  results: ReconciliationResult[];
};

export type ExceptionResolutionResponse = {
  resolutionId: number;
  resultId: number;
  resolutionStatus: Extract<ResolutionStatus, 'RESOLVED' | 'IGNORED'>;
  note: string;
  resolvedAt: string;
};

export type ApiErrorDetail = {
  field?: string;
  message: string;
  source?: 'INTERNAL' | 'EXTERNAL';
  lineNumber?: number;
};

export type ApiError = {
  message: string;
  errors: ApiErrorDetail[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createReconciliation(
  internalFile: File,
  externalFile: File,
): Promise<CreateReconciliationResponse> {
  const formData = new FormData();
  formData.append('internalFile', internalFile);
  formData.append('externalFile', externalFile);

  return request<CreateReconciliationResponse>('/api/reconciliations', {
    method: 'POST',
    body: formData,
  });
}

export function getReconciliationRun(runId: number): Promise<ReconciliationRun> {
  return request<ReconciliationRun>(`/api/reconciliations/${runId}`);
}

export function getReconciliationResults(runId: number): Promise<ReconciliationResult[]> {
  return request<ReconciliationResult[]>(`/api/reconciliations/${runId}/results`);
}

export function getReconciliationExceptions(runId: number): Promise<ReconciliationResult[]> {
  return request<ReconciliationResult[]>(`/api/reconciliations/${runId}/exceptions`);
}

export function resolveException(
  resultId: number,
  resolutionStatus: Extract<ResolutionStatus, 'RESOLVED' | 'IGNORED'>,
  note: string,
): Promise<ExceptionResolutionResponse> {
  return request<ExceptionResolutionResponse>(`/api/exceptions/${resultId}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolutionStatus, note }),
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw await toApiError(response);
  }

  return response.json() as Promise<T>;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    return (await response.json()) as ApiError;
  } catch {
    return {
      message: `Request failed with status ${response.status}.`,
      errors: [],
    };
  }
}
