import { AlertTriangle, CheckCircle2, CircleDot } from 'lucide-react';

import type {
  ReconciliationResult,
  ReconciliationStatus,
  ResolutionStatus,
} from '../lib/api';
import { formatStatus } from '../lib/format';

const reconciliationTone: Record<ReconciliationStatus, string> = {
  MATCHED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  MISSING_INTERNAL: 'border-blue-200 bg-blue-50 text-blue-800',
  MISSING_EXTERNAL: 'border-blue-200 bg-blue-50 text-blue-800',
  PRICE_MISMATCH: 'border-amber-200 bg-amber-50 text-amber-900',
  QUANTITY_MISMATCH: 'border-amber-200 bg-amber-50 text-amber-900',
  CURRENCY_MISMATCH: 'border-amber-200 bg-amber-50 text-amber-900',
  DUPLICATE: 'border-rose-200 bg-rose-50 text-rose-800',
};

const resolutionTone: Record<ResolutionStatus, string> = {
  OPEN: 'border-amber-200 bg-amber-50 text-amber-900',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  IGNORED: 'border-neutral-200 bg-neutral-100 text-neutral-700',
};

export function StatusBadge({ status }: { status: ReconciliationStatus }) {
  const Icon = status === 'MATCHED' ? CheckCircle2 : AlertTriangle;

  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${reconciliationTone[status]}`}
    >
      <Icon aria-hidden="true" size={13} strokeWidth={2.25} />
      {formatStatus(status)}
    </span>
  );
}

export function ResolutionBadge({ result }: { result: ReconciliationResult }) {
  if (!result.latestResolution && result.status === 'MATCHED') {
    return <span className="text-xs text-neutral-400">Not required</span>;
  }

  const status = result.latestResolution?.resolutionStatus ?? 'OPEN';

  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${resolutionTone[status]}`}
    >
      <CircleDot aria-hidden="true" size={12} strokeWidth={2.5} />
      {formatStatus(status)}
    </span>
  );
}
