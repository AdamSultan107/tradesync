import { AlertTriangle, CheckCircle2, Files, Landmark } from 'lucide-react';

import type { ReconciliationRun } from '../lib/api';
import { formatCount } from '../lib/format';

const metrics = [
  {
    key: 'internalTradeCount',
    label: 'Internal records',
    icon: Landmark,
    iconClass: 'bg-emerald-50 text-emerald-700',
  },
  {
    key: 'externalTradeCount',
    label: 'External records',
    icon: Files,
    iconClass: 'bg-blue-50 text-blue-700',
  },
  {
    key: 'matchedCount',
    label: 'Matched',
    icon: CheckCircle2,
    iconClass: 'bg-neutral-100 text-neutral-700',
  },
  {
    key: 'exceptionCount',
    label: 'Exceptions',
    icon: AlertTriangle,
    iconClass: 'bg-amber-50 text-amber-800',
  },
] as const;

export function RunOverview({ run }: { run: ReconciliationRun }) {
  return (
    <section
      aria-label="Run summary"
      className="grid grid-cols-2 overflow-hidden border border-neutral-200 bg-white shadow-xs xl:grid-cols-4"
    >
      {metrics.map((metric, index) => {
        const Icon = metric.icon;

        return (
          <div
            key={metric.key}
            className={`flex min-h-24 items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5 ${
              index % 2 === 1 ? 'border-l border-neutral-200' : ''
            } ${index >= 2 ? 'border-t border-neutral-200 xl:border-t-0' : ''} ${
              index === 2 ? 'xl:border-l' : ''
            }`}
          >
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-md ${metric.iconClass}`}>
              <Icon aria-hidden="true" size={19} />
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums text-neutral-950">
                {formatCount(run[metric.key])}
              </div>
              <div className="mt-0.5 text-xs font-medium text-neutral-500">
                {metric.label}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
