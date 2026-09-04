import {
  Check,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Play,
  ShieldCheck,
  X,
} from 'lucide-react';
import { type FormEvent, useRef } from 'react';

import { ErrorPanel, NoticePanel } from '../components/Feedback';
import type { ApiError } from '../lib/api';
import { formatFileSize } from '../lib/format';

const requiredColumns = [
  'trade_id',
  'symbol',
  'quantity',
  'price',
  'currency',
  'trade_date',
];

export function UploadView({
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
    <form onSubmit={onSubmit}>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="grid gap-4 md:grid-cols-2">
            <FilePicker
              id="internal-trades"
              step="01"
              label="Internal source"
              source="System-of-record export"
              file={internalFile}
              onChange={onInternalFile}
            />
            <FilePicker
              id="external-trades"
              step="02"
              label="External source"
              source="Broker or clearing export"
              file={externalFile}
              onChange={onExternalFile}
            />
          </div>

          {notice ? <div className="mt-4"><NoticePanel message={notice} /></div> : null}
          {error ? <div className="mt-4"><ErrorPanel error={error} /></div> : null}

          <div className="mt-4 flex flex-col gap-4 border border-neutral-200 bg-white px-5 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                  canRun ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {canRun ? <Check aria-hidden="true" size={18} /> : <ShieldCheck aria-hidden="true" size={18} />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-900">
                  {canRun ? 'Both sources are ready' : 'Two CSV files required'}
                </div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  Files are validated before reconciliation begins.
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={!canRun || isSubmitting}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={17} />
              ) : (
                <Play aria-hidden="true" size={16} fill="currentColor" />
              )}
              {isSubmitting ? 'Reconciling' : 'Run reconciliation'}
            </button>
          </div>
        </div>

        <aside className="border border-neutral-200 bg-white shadow-xs">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-neutral-950">Input schema</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Both files must contain the same six columns.
            </p>
          </div>
          <ol className="divide-y divide-neutral-100 px-5">
            {requiredColumns.map((column, index) => (
              <li key={column} className="flex items-center gap-3 py-3 text-sm">
                <span className="w-5 text-xs tabular-nums text-neutral-400">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <code className="font-mono text-xs font-medium text-neutral-800">{column}</code>
                <Check aria-hidden="true" className="ml-auto text-emerald-600" size={14} />
              </li>
            ))}
          </ol>
          <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-3 text-xs text-neutral-500">
            Accepted format: CSV
          </div>
        </aside>
      </div>
    </form>
  );
}

function FilePicker({
  id,
  step,
  label,
  source,
  file,
  onChange,
}: {
  id: string;
  step: string;
  label: string;
  source: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function clearFile() {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onChange(null);
  }

  return (
    <section className="flex min-h-64 flex-col border border-neutral-200 bg-white shadow-xs">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
        <div>
          <div className="text-xs font-semibold text-emerald-700">STEP {step}</div>
          <h2 className="mt-1 text-base font-semibold text-neutral-950">{label}</h2>
          <p className="mt-1 text-xs text-neutral-500">{source}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-md ${file ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
          {file ? <Check aria-hidden="true" size={18} /> : <FileSpreadsheet aria-hidden="true" size={18} />}
        </div>
      </div>

      <div className="flex flex-1 items-center px-5 py-5">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
          className="sr-only"
        />
        {file ? (
          <div className="flex w-full min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <FileSpreadsheet aria-hidden="true" size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-neutral-900" title={file.name}>
                {file.name}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {formatFileSize(file.size)} / CSV
              </div>
            </div>
            <label
              htmlFor={id}
              className="cursor-pointer rounded-md border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Replace
            </label>
            <button
              type="button"
              title={`Remove ${label.toLowerCase()} file`}
              aria-label={`Remove ${label.toLowerCase()} file`}
              onClick={clearFile}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-neutral-400 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-rose-600"
            >
              <X aria-hidden="true" size={17} />
            </button>
          </div>
        ) : (
          <div className="w-full text-center">
            <FileUp aria-hidden="true" className="mx-auto text-neutral-400" size={24} />
            <p className="mt-3 text-sm font-medium text-neutral-700">No file selected</p>
            <label
              htmlFor={id}
              className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-600"
            >
              <FileUp aria-hidden="true" size={15} />
              Choose CSV
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
