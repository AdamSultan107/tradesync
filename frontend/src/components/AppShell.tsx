import {
  AlertTriangle,
  ArrowLeftRight,
  Database,
  FilePlus2,
  History,
  Loader2,
  RefreshCw,
  Rows3,
} from 'lucide-react';
import type { ReactNode } from 'react';

import type { ReconciliationRun } from '../lib/api';
import { formatDateTime, formatStatus } from '../lib/format';

export type ViewKey = 'upload' | 'results' | 'exceptions';

const navigation = [
  { key: 'upload', label: 'New run', icon: FilePlus2 },
  { key: 'results', label: 'Results', icon: Rows3 },
  { key: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
] as const;

const pageCopy: Record<ViewKey, { title: string; description: string }> = {
  upload: {
    title: 'New reconciliation',
    description: 'Compare internal and external trade records.',
  },
  results: {
    title: 'Reconciliation results',
    description: 'Inspect matched trades and breaks across both sources.',
  },
  exceptions: {
    title: 'Exception review',
    description: 'Investigate breaks and record a review outcome.',
  },
};

export function AppShell({
  activeView,
  run,
  recentRuns,
  isBusy,
  isRefreshing,
  isHistoryLoading,
  historyError,
  onViewChange,
  onSelectRun,
  onRefresh,
  children,
}: {
  activeView: ViewKey;
  run: ReconciliationRun | null;
  recentRuns: ReconciliationRun[];
  isBusy: boolean;
  isRefreshing: boolean;
  isHistoryLoading: boolean;
  historyError: string | null;
  onViewChange: (view: ViewKey) => void;
  onSelectRun: (runId: number) => void;
  onRefresh: () => void;
  children: ReactNode;
}) {
  const copy = pageCopy[activeView];

  return (
    <div className="min-h-screen bg-[#f3f5f3] text-neutral-900">
      <DesktopSidebar
        activeView={activeView}
        run={run}
        recentRuns={recentRuns}
        isBusy={isBusy}
        isHistoryLoading={isHistoryLoading}
        historyError={historyError}
        onViewChange={onViewChange}
        onSelectRun={onSelectRun}
      />

      <MobileHeader
        activeView={activeView}
        run={run}
        recentRuns={recentRuns}
        isBusy={isBusy}
        onViewChange={onViewChange}
        onSelectRun={onSelectRun}
      />

      <div className="lg:pl-68">
        <header className="sticky top-0 z-20 hidden h-20 items-center justify-between border-b border-neutral-200 bg-white/95 px-6 backdrop-blur-sm lg:flex xl:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-neutral-950">{copy.title}</h1>
              {run && activeView !== 'upload' ? (
                <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600">
                  Run {run.runId}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-neutral-500">{copy.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {run ? (
              <div className="hidden text-right xl:block">
                <div className="text-xs font-semibold text-neutral-700">
                  {formatStatus(run.status)}
                </div>
                <div className="mt-0.5 text-xs text-neutral-400">
                  {formatDateTime(run.startedAt)}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              title="Refresh current run"
              aria-label="Refresh current run"
              disabled={!run || isBusy}
              onClick={onRefresh}
              className="flex size-10 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRefreshing ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={17} />
              ) : (
                <RefreshCw aria-hidden="true" size={17} />
              )}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6 xl:px-8 xl:py-8">
          <div className="mb-5 lg:hidden">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-950">{copy.title}</h1>
              {run && activeView !== 'upload' ? (
                <span className="rounded-md bg-neutral-200 px-2 py-1 text-xs font-semibold text-neutral-600">
                  Run {run.runId}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-neutral-500">{copy.description}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function DesktopSidebar({
  activeView,
  run,
  recentRuns,
  isBusy,
  isHistoryLoading,
  historyError,
  onViewChange,
  onSelectRun,
}: {
  activeView: ViewKey;
  run: ReconciliationRun | null;
  recentRuns: ReconciliationRun[];
  isBusy: boolean;
  isHistoryLoading: boolean;
  historyError: string | null;
  onViewChange: (view: ViewKey) => void;
  onSelectRun: (runId: number) => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 flex-col bg-[#19231f] text-white lg:flex">
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <Brand />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
        <nav aria-label="Primary" className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const unavailable = item.key !== 'upload' && run === null;
            const active = activeView === item.key;

            return (
              <button
                key={item.key}
                type="button"
                disabled={unavailable}
                onClick={() => onViewChange(item.key)}
                className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                  active
                    ? 'bg-white text-[#19231f]'
                    : 'text-neutral-300 hover:bg-white/[0.08] hover:text-white'
                } disabled:cursor-not-allowed disabled:opacity-[0.35]`}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
                {item.key === 'exceptions' && run?.exceptionCount ? (
                  <span
                    className={`ml-auto min-w-6 rounded px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums ${
                      active ? 'bg-amber-100 text-amber-900' : 'bg-amber-400/15 text-amber-200'
                    }`}
                  >
                    {run.exceptionCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <section className="mt-7 flex min-h-0 flex-1 flex-col" aria-labelledby="run-history-heading">
          <div className="flex items-center justify-between px-3">
            <h2
              id="run-history-heading"
              className="flex items-center gap-2 text-xs font-semibold text-neutral-400"
            >
              <History aria-hidden="true" size={14} />
              Recent runs
            </h2>
            {isHistoryLoading ? (
              <Loader2 aria-hidden="true" className="animate-spin text-neutral-500" size={14} />
            ) : null}
          </div>

          {historyError ? (
            <p className="mx-3 mt-3 text-xs leading-5 text-rose-300">{historyError}</p>
          ) : null}

          <div className="mt-3 min-h-0 space-y-1 overflow-y-auto pr-1">
            {recentRuns.length === 0 && !isHistoryLoading ? (
              <p className="px-3 py-3 text-xs text-neutral-500">No runs yet</p>
            ) : null}
            {recentRuns.map((historyRun) => {
              const active = historyRun.runId === run?.runId;

              return (
                <button
                  key={historyRun.runId}
                  type="button"
                  disabled={isBusy || active}
                  onClick={() => onSelectRun(historyRun.runId)}
                  className={`w-full border-l-2 px-3 py-2.5 text-left transition ${
                    active
                      ? 'border-emerald-400 bg-white/[0.08] text-white'
                      : 'border-transparent text-neutral-300 hover:border-white/20 hover:bg-white/5 hover:text-white'
                  } disabled:cursor-default`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Run {historyRun.runId}</span>
                    <RunOutcome run={historyRun} />
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-neutral-500">
                    <span>{historyRun.matchedCount} matched</span>
                    <span>{historyRun.exceptionCount} breaks</span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {formatDateTime(historyRun.startedAt)}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Database aria-hidden="true" size={14} />
          <span>Local API</span>
          <span className={`ml-auto size-2 rounded-full ${isBusy ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        </div>
      </div>
    </aside>
  );
}

function MobileHeader({
  activeView,
  run,
  recentRuns,
  isBusy,
  onViewChange,
  onSelectRun,
}: {
  activeView: ViewKey;
  run: ReconciliationRun | null;
  recentRuns: ReconciliationRun[];
  isBusy: boolean;
  onViewChange: (view: ViewKey) => void;
  onSelectRun: (runId: number) => void;
}) {
  return (
    <header className="bg-[#19231f] text-white lg:hidden">
      <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
        <Brand compact />
        {recentRuns.length > 0 ? (
          <select
            aria-label="Select reconciliation run"
            value={run?.runId ?? ''}
            disabled={isBusy}
            onChange={(event) => onSelectRun(Number(event.target.value))}
            className="h-9 w-28 min-w-0 shrink rounded-md border border-white/15 bg-white/10 px-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-emerald-400 sm:w-32"
          >
            <option value="" disabled className="text-neutral-900">
              Select run
            </option>
            {recentRuns.map((historyRun) => (
              <option key={historyRun.runId} value={historyRun.runId} className="text-neutral-900">
                Run {historyRun.runId}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <nav aria-label="Primary" className="grid grid-cols-3 border-t border-white/10 px-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const unavailable = item.key !== 'upload' && run === null;
          const active = item.key === activeView;

          return (
            <button
              key={item.key}
              type="button"
              disabled={unavailable}
              onClick={() => onViewChange(item.key)}
              className={`flex h-12 min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 text-xs font-medium ${
                active
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-neutral-400'
              } disabled:opacity-30`}
            >
              <Icon aria-hidden="true" size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-md bg-emerald-400 text-[#14201b]">
        <ArrowLeftRight aria-hidden="true" size={19} strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-base font-semibold">TradeSync</div>
        {!compact ? <div className="mt-0.5 text-xs text-neutral-400">Reconciliation desk</div> : null}
      </div>
    </div>
  );
}

function RunOutcome({ run }: { run: ReconciliationRun }) {
  if (run.status !== 'COMPLETED') {
    return <span className="text-xs text-neutral-500">{formatStatus(run.status)}</span>;
  }

  return run.exceptionCount > 0 ? (
    <span className="size-2 rounded-full bg-amber-400" title="Completed with exceptions" />
  ) : (
    <span className="size-2 rounded-full bg-emerald-400" title="Completed without exceptions" />
  );
}
