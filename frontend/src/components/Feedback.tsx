import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import type { ApiError } from '../lib/api';
import { formatErrorDetail } from '../lib/format';

export function NoticePanel({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
      <span>{message}</span>
    </div>
  );
}

export function ErrorPanel({ error }: { error: ApiError }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
      <div className="min-w-0">
        <div className="font-semibold">{error.message}</div>
        {error.errors.length > 0 ? (
          <ul className="mt-2 space-y-1 text-rose-800">
            {error.errors.map((detail, index) => (
              <li key={`${detail.field ?? 'error'}-${index}`}>
                {formatErrorDetail(detail)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = ClipboardList,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <section className="border border-neutral-200 bg-white px-6 py-16 text-center shadow-xs">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <Icon aria-hidden="true" size={21} />
      </div>
      <h2 className="mt-4 text-base font-semibold text-neutral-950">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-neutral-500">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
