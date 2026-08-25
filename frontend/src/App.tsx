import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSearch,
  FileUp,
  ListFilter,
  Play,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import type { ReconciliationStatus } from './lib/api';

type ViewKey = 'upload' | 'results' | 'exceptions';

const navItems: Array<{ key: ViewKey; label: string; icon: LucideIcon }> = [
  { key: 'upload', label: 'Upload', icon: FileUp },
  { key: 'results', label: 'Results', icon: FileSearch },
  { key: 'exceptions', label: 'Exceptions', icon: ClipboardCheck },
];

const sampleResults: Array<{
  tradeId: string;
  status: ReconciliationStatus;
  symbol: string;
  internal: string;
  external: string;
  variance: string;
}> = [
  {
    tradeId: 'T001',
    status: 'MATCHED',
    symbol: 'AAPL',
    internal: '225.40',
    external: '225.40',
    variance: '0.00',
  },
  {
    tradeId: 'T002',
    status: 'PRICE_MISMATCH',
    symbol: 'MSFT',
    internal: '510.25',
    external: '511.00',
    variance: '0.75',
  },
  {
    tradeId: 'T003',
    status: 'DUPLICATE',
    symbol: 'NVDA',
    internal: '2 rows',
    external: '1 row',
    variance: 'Review',
  },
];

function App() {
  const [activeView, setActiveView] = useState<ViewKey>('upload');
  const [internalFile, setInternalFile] = useState<string>('');
  const [externalFile, setExternalFile] = useState<string>('');
  const currentView = useMemo(() => {
    if (activeView === 'results') {
      return <ResultsView />;
    }

    if (activeView === 'exceptions') {
      return <ExceptionsView />;
    }

    return (
      <UploadView
        internalFile={internalFile}
        externalFile={externalFile}
        onInternalFile={setInternalFile}
        onExternalFile={setExternalFile}
      />
    );
  }, [activeView, externalFile, internalFile]);

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
              API ready
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
              <p className="mt-1 text-sm text-neutral-600">Run 1042 · Completed · 3 exceptions</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                title="Refresh"
                className="flex size-10 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
              >
                <RotateCcw aria-hidden="true" size={17} />
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
            <Metric label="Internal trades" value="3" tone="emerald" />
            <Metric label="External trades" value="2" tone="sky" />
            <Metric label="Matched" value="1" tone="neutral" />
            <Metric label="Exceptions" value="3" tone="amber" />
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
  onInternalFile,
  onExternalFile,
}: {
  internalFile: string;
  externalFile: string;
  onInternalFile: (fileName: string) => void;
  onExternalFile: (fileName: string) => void;
}) {
  const canRun = internalFile.length > 0 && externalFile.length > 0;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">New reconciliation</h2>
          <p className="mt-1 text-sm text-neutral-500">trade_id, symbol, quantity, price, currency, trade_date</p>
        </div>
        <button
          type="button"
          title="Run reconciliation"
          disabled={!canRun}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          <Play aria-hidden="true" size={16} />
          Run
        </button>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <FilePicker
          label="Internal source"
          fileName={internalFile}
          onChange={onInternalFile}
        />
        <FilePicker
          label="External source"
          fileName={externalFile}
          onChange={onExternalFile}
        />
      </div>
    </section>
  );
}

function FilePicker({
  label,
  fileName,
  onChange,
}: {
  label: string;
  fileName: string;
  onChange: (fileName: string) => void;
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
        onChange={(event) => onChange(event.target.files?.[0]?.name ?? '')}
        className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
      />
      <span className="mt-3 block min-h-5 text-sm text-neutral-500">
        {fileName || 'No file selected'}
      </span>
    </label>
  );
}

function ResultsView() {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
        <h2 className="text-base font-semibold text-neutral-950">Results</h2>
        <button
          type="button"
          title="Open exception review"
          className="flex h-9 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <ArrowRight aria-hidden="true" size={16} />
          Review
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Trade ID</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Symbol</th>
              <th className="px-4 py-3 font-semibold">Internal</th>
              <th className="px-4 py-3 font-semibold">External</th>
              <th className="px-4 py-3 font-semibold">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sampleResults.map((result) => (
              <tr key={`${result.tradeId}-${result.status}`} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-950">{result.tradeId}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={result.status} />
                </td>
                <td className="px-4 py-3 text-neutral-700">{result.symbol}</td>
                <td className="px-4 py-3 tabular-nums text-neutral-700">{result.internal}</td>
                <td className="px-4 py-3 tabular-nums text-neutral-700">{result.external}</td>
                <td className="px-4 py-3 text-neutral-700">{result.variance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExceptionsView() {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-4">
          <h2 className="text-base font-semibold text-neutral-950">Exception queue</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {sampleResults
            .filter((result) => result.status !== 'MATCHED')
            .map((result) => (
              <div key={result.tradeId} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-950">{result.tradeId}</span>
                    <StatusBadge status={result.status} />
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-neutral-600 sm:grid-cols-3">
                    <span>{result.symbol}</span>
                    <span>Internal {result.internal}</span>
                    <span>External {result.external}</span>
                  </div>
                </div>
                <button
                  type="button"
                  title="Resolve exception"
                  className="flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 aria-hidden="true" size={16} />
                  Resolve
                </button>
              </div>
            ))}
        </div>
      </div>

      <form className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-base font-semibold text-neutral-950">Resolution</h2>
        <label className="mt-4 block text-sm font-medium text-neutral-700" htmlFor="resolution-status">
          Status
        </label>
        <select
          id="resolution-status"
          className="mt-2 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
          defaultValue="RESOLVED"
        >
          <option value="RESOLVED">Resolved</option>
          <option value="IGNORED">Ignored</option>
        </select>

        <label className="mt-4 block text-sm font-medium text-neutral-700" htmlFor="resolution-note">
          Note
        </label>
        <textarea
          id="resolution-note"
          rows={5}
          className="mt-2 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          defaultValue="Reviewed against source records."
        />

        <button
          type="button"
          title="Save resolution"
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800"
        >
          <ClipboardCheck aria-hidden="true" size={17} />
          Save
        </button>
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
      className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ${
        isMatched
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
      }`}
    >
      {isMatched ? <CheckCircle2 aria-hidden="true" size={14} /> : <AlertTriangle aria-hidden="true" size={14} />}
      {status}
    </span>
  );
}

export default App;
