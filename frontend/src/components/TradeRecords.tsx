import { ArrowRightLeft, FileQuestion } from 'lucide-react';

import type { Trade } from '../lib/api';
import { formatDecimal, formatPrice } from '../lib/format';

type TradeField = 'symbol' | 'quantity' | 'price' | 'currency' | 'tradeDate';

const tradeFields: Array<{
  key: TradeField;
  label: string;
  format: (trade: Trade) => string;
}> = [
  { key: 'symbol', label: 'Symbol', format: (trade) => trade.symbol },
  { key: 'quantity', label: 'Quantity', format: (trade) => formatDecimal(trade.quantity) },
  { key: 'price', label: 'Price', format: (trade) => formatPrice(trade.price) },
  { key: 'currency', label: 'Currency', format: (trade) => trade.currency },
  { key: 'tradeDate', label: 'Trade date', format: (trade) => trade.tradeDate },
];

export function TradeSummary({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return <span className="text-sm text-neutral-400">No record</span>;
  }

  const trade = trades[0];

  return (
    <div className="min-w-44">
      <div className="font-semibold text-neutral-900">
        {trade.symbol}
        {trades.length > 1 ? (
          <span className="ml-2 text-xs font-medium text-rose-700">+{trades.length - 1} duplicate</span>
        ) : null}
      </div>
      <div className="mt-1 text-xs tabular-nums text-neutral-600">
        {formatDecimal(trade.quantity)} @ {formatPrice(trade.price)} {trade.currency}
      </div>
      <div className="mt-1 text-xs text-neutral-400">{trade.tradeDate}</div>
    </div>
  );
}

export function TradeComparison({
  internalTrades,
  externalTrades,
}: {
  internalTrades: Trade[];
  externalTrades: Trade[];
}) {
  const mismatches = findMismatches(internalTrades, externalTrades);

  return (
    <section aria-labelledby="comparison-heading" className="border-t border-neutral-200">
      <div className="flex items-center gap-2 px-5 py-4">
        <ArrowRightLeft aria-hidden="true" className="text-neutral-500" size={17} />
        <h3 id="comparison-heading" className="text-sm font-semibold text-neutral-950">
          Source comparison
        </h3>
      </div>
      <div className="grid border-t border-neutral-200 lg:grid-cols-2">
        <TradeGroup
          label="Internal source"
          trades={internalTrades}
          mismatches={mismatches}
        />
        <TradeGroup
          label="External source"
          trades={externalTrades}
          mismatches={mismatches}
          external
        />
      </div>
    </section>
  );
}

function TradeGroup({
  label,
  trades,
  mismatches,
  external = false,
}: {
  label: string;
  trades: Trade[];
  mismatches: Set<TradeField>;
  external?: boolean;
}) {
  return (
    <div className={`${external ? 'border-t border-neutral-200 lg:border-t-0 lg:border-l' : ''}`}>
      <div className="flex items-center justify-between bg-neutral-50 px-5 py-3">
        <span className="text-xs font-semibold text-neutral-700">{label}</span>
        <span className="text-xs text-neutral-400">
          {trades.length} {trades.length === 1 ? 'record' : 'records'}
        </span>
      </div>
      {trades.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center gap-2 px-5 py-8 text-center text-neutral-400">
          <FileQuestion aria-hidden="true" size={22} />
          <span className="text-sm">Record not found</span>
        </div>
      ) : (
        <div className="divide-y divide-neutral-200">
          {trades.map((trade, index) => (
            <dl key={`${trade.source}-${trade.tradeId}-${index}`} className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4">
              {trades.length > 1 ? (
                <div className="col-span-2 text-xs font-semibold text-rose-700">
                  Record {index + 1} of {trades.length}
                </div>
              ) : null}
              {tradeFields.map((field) => (
                <div
                  key={field.key}
                  className={`min-w-0 ${mismatches.has(field.key) ? 'border-l-2 border-amber-400 pl-2' : ''}`}
                >
                  <dt className="text-xs text-neutral-400">{field.label}</dt>
                  <dd className="mt-0.5 truncate text-sm font-medium text-neutral-900 tabular-nums">
                    {field.format(trade)}
                  </dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
      )}
    </div>
  );
}

function findMismatches(internalTrades: Trade[], externalTrades: Trade[]): Set<TradeField> {
  if (internalTrades.length !== 1 || externalTrades.length !== 1) {
    return new Set();
  }

  const internal = internalTrades[0];
  const external = externalTrades[0];

  return new Set(
    tradeFields
      .filter((field) => field.format(internal) !== field.format(external))
      .map((field) => field.key),
  );
}
