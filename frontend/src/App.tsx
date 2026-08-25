import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSearch,
  FileUp,
  ListFilter,
  Loader2,
  Play,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

import {
  createReconciliation,
  getReconciliationExceptions,
  getReconciliationResults,
  getReconciliationRun,
  resolveException,
  type ApiError,
  type ApiErrorDetail,
  type ReconciliationResult,
  type ReconciliationRun,
  type ReconciliationStatus,
  type ResolutionStatus,
  type Trade,
} from './lib/api';

type ViewKey = 'upload' | 'results' | 'exceptions';
type LoadState = 'idle' | 'submitting' | 'refreshing';
type ResolutionAction = Extract<ResolutionStatus, 'RESOLVED' | 'IGNORED'>;

const navItems: Array<{ key: ViewKey; label: string; icon: LucideIcon }> = [
  { key: 'upload', label: 'Upload', icon: FileUp },
  { key: 'results', label: 'Results', icon: FileSearch },
  { key: 'exceptions', label: 'Exceptions', icon: ClipboardCheck },
];

const statusTone: Record<ReconciliationStatus, string> = {
  MATCHED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  MISSING_INTERNAL: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200',
  MISSING_EXTERNAL: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200',
  PRICE_MISMATCH: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  QUANTITY_MISMATCH: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  CURRENCY_MISMATCH: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  DUPLICATE: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

function App() {
  const [activeView, setActiveView] = useState<ViewKey>('upload');
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const [run, setRun] = useState<ReconciliationRun | null>(null);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [exceptions, setExceptions] = useState<ReconciliationResult[]>([]);
  const [selectedExceptionId, setSelectedExceptionId] = useState<number | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionAction>('RESOLVED');
  const [resolutionNote, setResolutionNote] = useState('Reviewed against source records.');
  const [resolvedResultIds, setResolvedResultIds] = useState<Set<number>>(() => new Set());
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [resolvingResultId, setResolvingResultId] = useState<number | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isBusy = loadState !== 'idle';
  const selectedException = useMemo(
    () =>
      exceptions.find((result) => result.resultId === selectedExceptionId) ??
      exceptions[0] ??
      null,
    [exceptions, selectedExceptionId],
  );

  async function loadRunData(runId: number) {
    const [nextRun, nextResults, nextExceptions] = await Promise.all([
      getReconciliationRun(runId),
      getReconciliationResults(runId),
      getReconciliationExceptions(runId),
    ]);

    setRun(nextRun);
    setResults(nextResults);
    setExceptions(nextExceptions);
    setSelectedExceptionId((currentId) => {
      const currentStillExists = nextExceptions.some(
        (result) => result.resultId === currentId,
      );

      if (currentId !== null && currentStillExists) {
        return currentId;
      }

      return nextExceptions.find((result) => result.resultId !== undefined)?.resultId ?? null;
    });
  }

  async function handleCreateReconciliation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!internalFile || !externalFile || isBusy) {
      return;
    }

    setLoadState('submitting');
    setApiError(null);
    setNotice(null);

    try {
      const createdRun = await createReconciliation(internalFile, externalFile);
      await loadRunData(createdRun.runId);
      setNotice(`Run ${createdRun.runId} completed.`);
      setActiveView('results');
    } catch (error) {
      setApiError(toDisplayError(error));
      setActiveView('upload');
    } finally {
      setLoadState('idle');
    }
  }

  async function handleRefresh() {
    if (!run || isBusy) {
      return;
    }

    setLoadState('refreshing');
    setApiError(null);
    setNotice(null);

    try {
      await loadRunData(run.runId);
      setNotice(`Run ${run.runId} refreshed.`);
    } catch (error) {
      setApiError(toDisplayError(error));
    } finally {
      setLoadState('idle');
    }
  }

  async function handleResolveException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedException?.resultId || resolvingResultId !== null) {
      return;
    }

    if (resolutionNote.trim().length === 0) {
      setApiError({
        message: 'Resolution note is required.',
        errors: [{ field: 'note', message: 'must not be blank' }],
      });
      return;
    }

    setResolvingResultId(selectedException.resultId);
    setApiError(null);
    setNotice(null);

    try {
      await resolveException(
        selectedException.resultId,
        resolutionStatus,
        resolutionNote.trim(),
      );
      setResolvedResultIds((current) => new Set(current).add(selectedException.resultId!));
      setNotice(`${formatTradeId(selectedException)} marked ${formatStatus(resolutionStatus)}.`);

      if (run) {
        await loadRunData(run.runId);
      }
    } catch (error) {
      setApiError(toDisplayError(error));
    } finally {
      setResolvingResultId(null);
    }
  }

  const currentView =
    activeView === 'results' ? (
      <ResultsView
        run={run}
        results={results}
        error={apiError}
        notice={notice}
        onOpenExceptions={() => setActiveView('exceptions')}
      />
    ) : activeView === 'exceptions' ? (
      <ExceptionsView
        run={run}
        exceptions={exceptions}
        selectedException={selectedException}
        selectedExceptionId={selectedExceptionId}
        resolutionStatus={resolutionStatus}
        resolutionNote={resolutionNote}
        resolvingResultId={resolvingResultId}
        resolvedResultIds={resolvedResultIds}
        error={apiError}
        notice={notice}
        onSelectException={setSelectedExceptionId}
        onResolutionStatus={setResolutionStatus}
        onResolutionNote={setResolutionNote}
        onResolve={handleResolveException}
      />
    ) : (
      <UploadView
        internalFile={internalFile}
        externalFile={externalFile}
        isSubmitting={loadState === 'submitting'}
        error={apiError}
        notice={notice}
        onInternalFile={setInternalFile}
        onExternalFile={setExternalFile}
        onSubmit={handleCreateReconciliation}
      />
    );

  return (
    <div className="min-h-screen bg-[#f4f5f0] text-neutral-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-neutral-200 bg-white px-4 py-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Database aria-hidden="true" size={20} />
              </div>
              <div>
                <div className="text-base font-semibold">TradeSync</div>
                <div className="text-xs text-neutral-500">localhost:8080</div>
              </div>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {isBusy ? 'Working' : run ? `Run ${run.runId}` : 'Ready'}
            </div>
          </div>

          <nav className="mt-5 grid grid-cols-3 gap-2 lg:grid-cols-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.label}
                  onClick={() => setActiveView(item.key)}
                  className={`flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition lg:justify-start ${
                    activeView === item.key
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-transparent text-neutral-600 hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <Icon aria-hidden="true" size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-5 flex flex-col gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-neutral-950">
                Reconciliation Workspace
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                {run
                  ? `Run ${run.runId} | ${formatStatus(run.status)} | ${run.exceptionCount} exceptions`
                  : 'No reconciliation run loaded'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                title="Refresh"
                disabled={!run || isBusy}
                onClick={handleRefresh}
                className="flex size-10 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 transition enabled:hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadState === 'refreshing' ? (
                  <Loader2 aria-hidden="true" className="animate-spin" size={17} />
                ) : (
                  <RotateCcw aria-hidden="true" size={17} />
                )}
              </button>
              <button
                type="button"
                title="Open exceptions"
                onClick={() => setActiveView('exceptions')}
                className="flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800"
              >
                <ListFilter aria-hidden="true" size={17} />
                Exceptions
              </button>
            </div>
          </header>

          <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Internal trades"
              value={run ? formatCount(run.internalTradeCount) : '--'}
              tone="emerald"
            />
            <Metric
              label="External trades"
              value={run ? formatCount(run.externalTradeCount) : '--'}
              tone="sky"
            />
            <Metric
              label="Matched"
              value={run ? formatCount(run.matchedCount) : '--'}
              tone="neutral"
            />
            <Metric
              label="Exceptions"
              value={run ? formatCount(run.exceptionCount) : '--'}
              tone="amber"
            />
          </section>

          {currentView}
        </main>
      </div>
    </div>
  );
}

function UploadView({
  internalFile,
  externalFile,
  isSubmitting,
  error,
  notice,
  onInternalFile,
  onExternalFile,
  onSubmit,
}: {
  internalFile: File | null;
  externalFile: File | null;
  isSubmitting: boolean;
  error: ApiError | null;
  notice: string | null;
  onInternalFile: (file: File | null) => void;
  onExternalFile: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const canRun = internalFile !== null && externalFile !== null;

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">New reconciliation</h2>
          <p className="mt-1 text-sm text-neutral-500">
            trade_id, symbol, quantity, price, currency, trade_date
          </p>
        </div>
        <button
          type="submit"
          title="Run reconciliation"
          disabled={!canRun || isSubmitting}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={16} />
          ) : (
            <Play aria-hidden="true" size={16} />
          )}
          {isSubmitting ? 'Running' : 'Run'}
        </button>
      </div>

      <div className="space-y-4 p-4">
        {notice ? <NoticePanel message={notice} /> : null}
        {error ? <ErrorPanel error={error} /> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <FilePicker
            label="Internal source"
            file={internalFile}
            onChange={onInternalFile}
          />
          <FilePicker
            label="External source"
            file={externalFile}
            onChange={onExternalFile}
          />
        </div>
      </div>
    </form>
  );
}

function FilePicker({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="block rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
      <span className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-800">
        <FileUp aria-hidden="true" size={17} />
        {label}
      </span>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
        className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
      />
      <span className="mt-3 block min-h-5 text-sm text-neutral-500">
        {file ? `${file.name} (${formatFileSize(file.size)})` : 'No file selected'}
      </span>
    </label>
  );
}

function ResultsView({
  run,
  results,
  error,
  notice,
  onOpenExceptions,
}: {
  run: ReconciliationRun | null;
  results: ReconciliationResult[];
  error: ApiError | null;
  notice: string | null;
  onOpenExceptions: () => void;
}) {
  if (!run) {
    return <EmptyState icon={FileSearch} title="No results" body="No reconciliation run loaded." />;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Results</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Completed {run.completedAt ? formatDateTime(run.completedAt) : 'in progress'}
          </p>
        </div>
        <button
          type="button"
          title="Open exception review"
          onClick={onOpenExceptions}
          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <ArrowRight aria-hidden="true" size={16} />
          Review
        </button>
      </div>

      <div className="space-y-4 p-4">
        {notice ? <NoticePanel message={notice} /> : null}
        {error ? <ErrorPanel error={error} /> : null}
      </div>

      {results.length === 0 ? (
        <div className="px-4 pb-4">
          <EmptyState icon={FileSearch} title="No rows" body="No result rows returned." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Trade ID</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Internal</th>
                <th className="px-4 py-3 font-semibold">External</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {results.map((result) => (
                <tr key={resultKey(result)} className="align-top hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-950">
                    {formatTradeId(result)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={result.status} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-neutral-700">
                    {result.description}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <TradeStack trades={result.internalTrades} />
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    <TradeStack trades={result.externalTrades} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ExceptionsView({
  run,
  exceptions,
  selectedException,
  selectedExceptionId,
  resolutionStatus,
  resolutionNote,
  resolvingResultId,
  resolvedResultIds,
  error,
  notice,
  onSelectException,
  onResolutionStatus,
  onResolutionNote,
  onResolve,
}: {
  run: ReconciliationRun | null;
  exceptions: ReconciliationResult[];
  selectedException: ReconciliationResult | null;
  selectedExceptionId: number | null;
  resolutionStatus: ResolutionAction;
  resolutionNote: string;
  resolvingResultId: number | null;
  resolvedResultIds: Set<number>;
  error: ApiError | null;
  notice: string | null;
  onSelectException: (resultId: number | null) => void;
  onResolutionStatus: (status: ResolutionAction) => void;
  onResolutionNote: (note: string) => void;
  onResolve: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!run) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No exceptions"
        body="No reconciliation run loaded."
      />
    );
  }

  if (exceptions.length === 0) {
    return (
      <section className="space-y-4">
        {notice ? <NoticePanel message={notice} /> : null}
        {error ? <ErrorPanel error={error} /> : null}
        <EmptyState
          icon={ClipboardCheck}
          title="No exceptions"
          body="No exception rows returned for this run."
        />
      </section>
    );
  }

  const selectedResolved =
    selectedException?.resultId !== undefined &&
    resolvedResultIds.has(selectedException.resultId);
  const canResolve =
    selectedException?.resultId !== undefined &&
    resolvingResultId === null &&
    resolutionNote.trim().length > 0;

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-4">
          <h2 className="text-base font-semibold text-neutral-950">Exception queue</h2>
          <p className="mt-1 text-sm text-neutral-500">{exceptions.length} rows</p>
        </div>
        <div className="divide-y divide-neutral-100">
          {exceptions.map((result) => {
            const resultId = result.resultId ?? null;
            const isSelected =
              resultId !== null
                ? resultId === selectedExceptionId
                : result === selectedException;
            const wasResolved = resultId !== null && resolvedResultIds.has(resultId);

            return (
              <button
                key={resultKey(result)}
                type="button"
                onClick={() => onSelectException(resultId)}
                className={`block w-full px-4 py-4 text-left transition ${
                  isSelected ? 'bg-emerald-50/70' : 'bg-white hover:bg-neutral-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-950">
                      {formatTradeId(result)}
                    </span>
                    <StatusBadge status={result.status} />
                  </div>
                  {wasResolved ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Saved
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-neutral-600">{result.description}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                  <span>{result.internalTrades.length} internal</span>
                  <span>{result.externalTrades.length} external</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={onResolve} className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-base font-semibold text-neutral-950">Resolution</h2>
        {selectedException ? (
          <>
            <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-neutral-950">
                  {formatTradeId(selectedException)}
                </span>
                <StatusBadge status={selectedException.status} />
              </div>
              <p className="mt-2 text-sm text-neutral-600">{selectedException.description}</p>
              {selectedResolved ? (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  Resolution saved in this session.
                </p>
              ) : null}
            </div>

            {notice ? <NoticePanel message={notice} compact /> : null}
            {error ? <ErrorPanel error={error} compact /> : null}

            <label
              className="mt-4 block text-sm font-medium text-neutral-700"
              htmlFor="resolution-status"
            >
              Status
            </label>
            <select
              id="resolution-status"
              value={resolutionStatus}
              onChange={(event) => onResolutionStatus(event.target.value as ResolutionAction)}
              className="mt-2 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
            >
              <option value="RESOLVED">Resolved</option>
              <option value="IGNORED">Ignored</option>
            </select>

            <label
              className="mt-4 block text-sm font-medium text-neutral-700"
              htmlFor="resolution-note"
            >
              Note
            </label>
            <textarea
              id="resolution-note"
              rows={5}
              value={resolutionNote}
              onChange={(event) => onResolutionNote(event.target.value)}
              className="mt-2 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
            />

            <button
              type="submit"
              title="Save resolution"
              disabled={!canResolve}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition enabled:hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {resolvingResultId === selectedException.resultId ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={17} />
              ) : (
                <ClipboardCheck aria-hidden="true" size={17} />
              )}
              Save
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">No exception selected.</p>
        )}
      </form>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'sky' | 'neutral' | 'amber';
}) {
  const toneClasses = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    sky: 'border-sky-200 bg-sky-50 text-sky-800',
    neutral: 'border-neutral-200 bg-white text-neutral-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  };

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClasses[tone]}`}>
      <div className="text-xs font-medium uppercase text-current opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReconciliationStatus }) {
  const isMatched = status === 'MATCHED';

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[status]}`}
    >
      {isMatched ? (
        <CheckCircle2 aria-hidden="true" size={14} />
      ) : (
        <AlertTriangle aria-hidden="true" size={14} />
      )}
      {formatStatus(status)}
    </span>
  );
}

function TradeStack({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return <span className="text-neutral-400">None</span>;
  }

  return (
    <div className="space-y-2">
      {trades.map((trade, index) => (
        <div
          key={`${trade.source}-${trade.tradeId}-${index}`}
          className="min-w-48 rounded-md border border-neutral-200 bg-white px-3 py-2"
        >
          <div className="font-medium text-neutral-950">{trade.symbol}</div>
          <div className="mt-1 text-xs text-neutral-600">
            {formatDecimal(trade.quantity)} @ {formatPrice(trade.price)} {trade.currency}
          </div>
          <div className="mt-1 text-xs text-neutral-500">{trade.tradeDate}</div>
        </div>
      ))}
    </div>
  );
}

function NoticePanel({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-800 ${
        compact ? 'mt-4 px-3 py-2' : 'px-4 py-3'
      }`}
    >
      {message}
    </div>
  );
}

function ErrorPanel({ error, compact = false }: { error: ApiError; compact?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-rose-200 bg-rose-50 text-sm text-rose-800 ${
        compact ? 'mt-4 px-3 py-2' : 'px-4 py-3'
      }`}
    >
      <div className="font-semibold">{error.message}</div>
      {error.errors.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {error.errors.map((detail, index) => (
            <li key={`${detail.field ?? 'error'}-${index}`}>
              {formatErrorDetail(detail)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white px-4 py-10 text-center">
      <Icon aria-hidden="true" className="mx-auto text-neutral-400" size={28} />
      <h2 className="mt-3 text-base font-semibold text-neutral-950">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{body}</p>
    </section>
  );
}

function resultKey(result: ReconciliationResult): string {
  return result.resultId !== undefined
    ? String(result.resultId)
    : `${result.tradeId}-${result.status}`;
}

function formatTradeId(result: ReconciliationResult): string {
  return result.tradeId || 'Unmatched trade';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
  }).format(value);
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatErrorDetail(detail: ApiErrorDetail): string {
  const location = [
    detail.source,
    detail.lineNumber !== undefined ? `line ${detail.lineNumber}` : null,
    detail.field,
  ]
    .filter(Boolean)
    .join(' | ');

  return location ? `${location}: ${detail.message}` : detail.message;
}

function toDisplayError(error: unknown): ApiError {
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

export default App;
