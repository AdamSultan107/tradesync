import { ArrowRight, ClipboardCheck, FileSearch, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ResolutionBadge, StatusBadge } from '../components/Badges';
import { EmptyState, ErrorPanel, NoticePanel } from '../components/Feedback';
import { RunOverview } from '../components/RunOverview';
import { TradeSummary } from '../components/TradeRecords';
import type {
  ApiError,
  ReconciliationResult,
  ReconciliationRun,
  ReconciliationStatus,
} from '../lib/api';
import { formatDateTime, formatTradeId, resultKey } from '../lib/format';

type StatusFilter = 'ALL' | 'MATCHED' | 'EXCEPTIONS' | ReconciliationStatus;

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'All outcomes' },
  { value: 'MATCHED', label: 'Matched' },
  { value: 'EXCEPTIONS', label: 'All exceptions' },
  { value: 'MISSING_INTERNAL', label: 'Missing internal' },
  { value: 'MISSING_EXTERNAL', label: 'Missing external' },
  { value: 'PRICE_MISMATCH', label: 'Price mismatch' },
  { value: 'QUANTITY_MISMATCH', label: 'Quantity mismatch' },
  { value: 'CURRENCY_MISMATCH', label: 'Currency mismatch' },
  { value: 'DUPLICATE', label: 'Duplicate' },
];

export function ResultsView({
  run,
  results,
  error,
  notice,
  onOpenExceptions,
  onReviewException,
}: {
  run: ReconciliationRun | null;
  results: ReconciliationResult[];
  error: ApiError | null;
  notice: string | null;
  onOpenExceptions: () => void;
  onReviewException: (resultId: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const filteredResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return results.filter((result) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        result.tradeId.toLowerCase().includes(normalizedQuery) ||
        result.description.toLowerCase().includes(normalizedQuery) ||
        result.internalTrades.some((trade) => trade.symbol.toLowerCase().includes(normalizedQuery)) ||
        result.externalTrades.some((trade) => trade.symbol.toLowerCase().includes(normalizedQuery));
      const matchesStatus =
        statusFilter === 'ALL' ||
        result.status === statusFilter ||
        (statusFilter === 'EXCEPTIONS' && result.status !== 'MATCHED');

      return matchesQuery && matchesStatus;
    });
  }, [query, results, statusFilter]);

  if (!run) {
    return (
      <EmptyState
        icon={FileSearch}
        title="No run loaded"
        body="Start a reconciliation or select a recent run to inspect its results."
      />
    );
  }

  return (
    <div className="space-y-5">
      <RunOverview run={run} />

      {notice ? <NoticePanel message={notice} /> : null}
      {error ? <ErrorPanel error={error} /> : null}

      <section className="border border-neutral-200 bg-white shadow-xs">
        <div className="flex flex-col gap-4 border-b border-neutral-200 px-4 py-4 xl:flex-row xl:items-center xl:justify-between xl:px-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-950">Result ledger</h2>
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium tabular-nums text-neutral-600">
                {filteredResults.length} of {results.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Completed {run.completedAt ? formatDateTime(run.completedAt) : 'in progress'}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative min-w-0 sm:w-64">
              <span className="sr-only">Search results</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400"
                size={16}
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search trade ID or symbol"
                className="h-10 w-full rounded-md border border-neutral-300 bg-white pr-3 pl-9 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
              />
            </label>
            <label>
              <span className="sr-only">Filter by outcome</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 sm:w-44"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={run.exceptionCount === 0}
              onClick={onOpenExceptions}
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              <ClipboardCheck aria-hidden="true" size={16} />
              Review exceptions
            </button>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <FileSearch aria-hidden="true" className="mx-auto text-neutral-300" size={25} />
            <p className="mt-3 text-sm font-semibold text-neutral-800">No matching results</p>
            <p className="mt-1 text-xs text-neutral-500">Adjust the search or outcome filter.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full table-fixed text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                  <tr>
                    <th className="w-[13%] px-5 py-3 font-semibold">Trade ID</th>
                    <th className="w-[17%] px-5 py-3 font-semibold">Outcome</th>
                    <th className="w-[21%] px-5 py-3 font-semibold">Internal record</th>
                    <th className="w-[21%] px-5 py-3 font-semibold">External record</th>
                    <th className="w-[18%] px-5 py-3 font-semibold">Review</th>
                    <th className="w-[10%] px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredResults.map((result) => (
                    <ResultRow
                      key={resultKey(result)}
                      result={result}
                      onReviewException={onReviewException}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-neutral-200 md:hidden">
              {filteredResults.map((result) => (
                <ResultCard
                  key={resultKey(result)}
                  result={result}
                  onReviewException={onReviewException}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ResultRow({
  result,
  onReviewException,
}: {
  result: ReconciliationResult;
  onReviewException: (resultId: number) => void;
}) {
  return (
    <tr className="align-top transition hover:bg-neutral-50/70">
      <td className="px-5 py-4">
        <div className="font-mono text-xs font-semibold text-neutral-950">
          {formatTradeId(result)}
        </div>
        <div className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
          {result.description}
        </div>
      </td>
      <td className="px-5 py-4"><StatusBadge status={result.status} /></td>
      <td className="px-5 py-4"><TradeSummary trades={result.internalTrades} /></td>
      <td className="px-5 py-4"><TradeSummary trades={result.externalTrades} /></td>
      <td className="px-5 py-4"><ResolutionBadge result={result} /></td>
      <td className="px-5 py-4 text-right">
        {result.status !== 'MATCHED' && result.resultId !== undefined ? (
          <button
            type="button"
            title={`Review ${formatTradeId(result)}`}
            aria-label={`Review ${formatTradeId(result)}`}
            onClick={() => onReviewException(result.resultId!)}
            className="inline-flex size-8 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-emerald-600"
          >
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        ) : null}
      </td>
    </tr>
  );
}

function ResultCard({
  result,
  onReviewException,
}: {
  result: ReconciliationResult;
  onReviewException: (resultId: number) => void;
}) {
  return (
    <article className="px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-neutral-950">
          {formatTradeId(result)}
        </span>
        <StatusBadge status={result.status} />
      </div>
      <p className="mt-2 text-sm leading-5 text-neutral-600">{result.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-4 border-y border-neutral-100 py-3">
        <div>
          <div className="mb-2 text-xs font-semibold text-neutral-400">Internal</div>
          <TradeSummary trades={result.internalTrades} />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-neutral-400">External</div>
          <TradeSummary trades={result.externalTrades} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <ResolutionBadge result={result} />
        {result.status !== 'MATCHED' && result.resultId !== undefined ? (
          <button
            type="button"
            onClick={() => onReviewException(result.resultId!)}
            className="flex h-9 items-center gap-2 rounded-md border border-neutral-300 px-3 text-xs font-semibold text-neutral-700"
          >
            Review
            <ArrowRight aria-hidden="true" size={15} />
          </button>
        ) : null}
      </div>
    </article>
  );
}
