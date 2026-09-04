import {
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  Loader2,
  Search,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { ResolutionBadge, StatusBadge } from '../components/Badges';
import { EmptyState, ErrorPanel, NoticePanel } from '../components/Feedback';
import { RunOverview } from '../components/RunOverview';
import { TradeComparison } from '../components/TradeRecords';
import type {
  ApiError,
  ReconciliationResult,
  ReconciliationRun,
  ResolutionStatus,
} from '../lib/api';
import { formatDateTime, formatTradeId, resultKey } from '../lib/format';

type ResolutionAction = Extract<ResolutionStatus, 'RESOLVED' | 'IGNORED'>;
type QueueFilter = 'OPEN' | 'REVIEWED' | 'ALL';

const queueFilters: Array<{ value: QueueFilter; label: string }> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'ALL', label: 'All' },
];

export function ExceptionsView({
  run,
  exceptions,
  selectedException,
  selectedExceptionId,
  resolutionStatus,
  resolutionNote,
  resolvingResultId,
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
  error: ApiError | null;
  notice: string | null;
  onSelectException: (resultId: number | null) => void;
  onResolutionStatus: (status: ResolutionAction) => void;
  onResolutionNote: (note: string) => void;
  onResolve: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [queueFilter, setQueueFilter] = useState<QueueFilter>(() =>
    selectedException?.latestResolution ? 'REVIEWED' : 'OPEN',
  );
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!selectedException) {
      return;
    }

    setQueueFilter(selectedException.latestResolution ? 'REVIEWED' : 'OPEN');
  }, [selectedException?.latestResolution, selectedException?.resultId]);

  const filteredExceptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return exceptions.filter((result) => {
      const isReviewed = result.latestResolution !== undefined && result.latestResolution !== null;
      const matchesQueue =
        queueFilter === 'ALL' ||
        (queueFilter === 'OPEN' && !isReviewed) ||
        (queueFilter === 'REVIEWED' && isReviewed);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        result.tradeId.toLowerCase().includes(normalizedQuery) ||
        result.description.toLowerCase().includes(normalizedQuery) ||
        result.internalTrades.some((trade) => trade.symbol.toLowerCase().includes(normalizedQuery)) ||
        result.externalTrades.some((trade) => trade.symbol.toLowerCase().includes(normalizedQuery));

      return matchesQueue && matchesQuery;
    });
  }, [exceptions, query, queueFilter]);

  if (!run) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No run loaded"
        body="Start a reconciliation or select a recent run before reviewing exceptions."
      />
    );
  }

  if (exceptions.length === 0) {
    return (
      <div className="space-y-5">
        <RunOverview run={run} />
        {notice ? <NoticePanel message={notice} /> : null}
        {error ? <ErrorPanel error={error} /> : null}
        <EmptyState
          icon={CheckCircle2}
          title="No exceptions in this run"
          body="Every trade record matched across the internal and external sources."
        />
      </div>
    );
  }

  const openCount = exceptions.filter((result) => !result.latestResolution).length;

  return (
    <div className="space-y-5">
      <RunOverview run={run} />

      {notice ? <NoticePanel message={notice} /> : null}
      {error ? <ErrorPanel error={error} /> : null}

      <section className="grid min-w-0 border border-neutral-200 bg-white shadow-xs xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="min-w-0 border-b border-neutral-200 xl:border-r xl:border-b-0">
          <div className="border-b border-neutral-200 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-neutral-950">Review queue</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  {openCount} open / {exceptions.length} total
                </p>
              </div>
              <Inbox aria-hidden="true" className="text-neutral-400" size={19} />
            </div>

            <label className="relative mt-4 block">
              <span className="sr-only">Search exceptions</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400"
                size={15}
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search trade ID or symbol"
                className="h-9 w-full rounded-md border border-neutral-300 pr-3 pl-9 text-sm outline-none placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              />
            </label>

            <div className="mt-3 grid grid-cols-3 rounded-md bg-neutral-100 p-1" aria-label="Filter queue">
              {queueFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={queueFilter === filter.value}
                  onClick={() => setQueueFilter(filter.value)}
                  className={`h-8 rounded text-xs font-semibold transition ${
                    queueFilter === filter.value
                      ? 'bg-white text-neutral-950 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[600px] divide-y divide-neutral-100 overflow-y-auto">
            {filteredExceptions.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Search aria-hidden="true" className="mx-auto text-neutral-300" size={22} />
                <p className="mt-3 text-sm font-semibold text-neutral-700">No exceptions found</p>
                <p className="mt-1 text-xs text-neutral-500">Adjust the queue filter or search.</p>
              </div>
            ) : null}

            {filteredExceptions.map((result) => {
              const resultId = result.resultId ?? null;
              const selected =
                resultId !== null
                  ? resultId === selectedExceptionId
                  : result === selectedException;

              return (
                <button
                  key={resultKey(result)}
                  type="button"
                  onClick={() => onSelectException(resultId)}
                  className={`relative block w-full px-4 py-4 text-left transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-emerald-600 ${
                    selected ? 'bg-emerald-50/70' : 'bg-white hover:bg-neutral-50'
                  }`}
                >
                  {selected ? <span className="absolute inset-y-0 left-0 w-0.5 bg-emerald-600" /> : null}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-neutral-950">
                      {formatTradeId(result)}
                    </span>
                    <ResolutionBadge result={result} />
                  </div>
                  <div className="mt-2"><StatusBadge status={result.status} /></div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">
                    {result.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <ExceptionDetail
          selectedException={selectedException}
          resolutionStatus={resolutionStatus}
          resolutionNote={resolutionNote}
          resolvingResultId={resolvingResultId}
          onResolutionStatus={onResolutionStatus}
          onResolutionNote={onResolutionNote}
          onResolve={onResolve}
        />
      </section>
    </div>
  );
}

function ExceptionDetail({
  selectedException,
  resolutionStatus,
  resolutionNote,
  resolvingResultId,
  onResolutionStatus,
  onResolutionNote,
  onResolve,
}: {
  selectedException: ReconciliationResult | null;
  resolutionStatus: ResolutionAction;
  resolutionNote: string;
  resolvingResultId: number | null;
  onResolutionStatus: (status: ResolutionAction) => void;
  onResolutionNote: (note: string) => void;
  onResolve: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!selectedException) {
    return (
      <div className="flex min-h-96 items-center justify-center px-6 py-16 text-center">
        <div>
          <ClipboardCheck aria-hidden="true" className="mx-auto text-neutral-300" size={26} />
          <h2 className="mt-3 text-sm font-semibold text-neutral-800">Select an exception</h2>
          <p className="mt-1 text-xs text-neutral-500">Choose a trade from the review queue.</p>
        </div>
      </div>
    );
  }

  const selectedResolution = selectedException.latestResolution ?? null;
  const canResolve =
    selectedException.resultId !== undefined &&
    resolvingResultId === null &&
    resolutionNote.trim().length > 0;

  return (
    <form onSubmit={onResolve} className="min-w-0">
      <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-sm font-semibold text-neutral-950">
              {formatTradeId(selectedException)}
            </h2>
            <StatusBadge status={selectedException.status} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">
            {selectedException.description}
          </p>
        </div>
        <ResolutionBadge result={selectedException} />
      </div>

      <TradeComparison
        internalTrades={selectedException.internalTrades}
        externalTrades={selectedException.externalTrades}
      />

      {selectedResolution ? (
        <section className="border-t border-neutral-200 bg-emerald-50/50 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-emerald-900">Latest review</h3>
            <span className="text-xs text-emerald-800">
              {formatDateTime(selectedResolution.resolvedAt)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-emerald-950">{selectedResolution.note}</p>
        </section>
      ) : null}

      <section className="border-t border-neutral-200 px-5 py-5">
        <h3 className="text-sm font-semibold text-neutral-950">Record review outcome</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <fieldset>
            <legend className="text-xs font-semibold text-neutral-600">Outcome</legend>
            <div className="mt-2 grid grid-cols-2 rounded-md bg-neutral-100 p-1">
              {(['RESOLVED', 'IGNORED'] as ResolutionAction[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={resolutionStatus === status}
                  onClick={() => onResolutionStatus(status)}
                  className={`h-9 rounded text-xs font-semibold transition ${
                    resolutionStatus === status
                      ? 'bg-white text-neutral-950 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {status === 'RESOLVED' ? 'Resolved' : 'Ignored'}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block min-w-0 text-xs font-semibold text-neutral-600" htmlFor="resolution-note">
            Review note
            <textarea
              id="resolution-note"
              rows={3}
              value={resolutionNote}
              onChange={(event) => onResolutionNote(event.target.value)}
              className="mt-2 block w-full resize-y rounded-md border border-neutral-300 px-3 py-2.5 text-sm font-normal leading-6 text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              placeholder="Document what was checked and why."
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!canResolve}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {resolvingResultId === selectedException.resultId ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={17} />
            ) : (
              <ClipboardCheck aria-hidden="true" size={17} />
            )}
            Save review
          </button>
        </div>
      </section>
    </form>
  );
}
