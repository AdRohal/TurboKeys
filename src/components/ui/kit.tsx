import React from 'react';

/** Shared building blocks for the signed-in screens. */

export const PageShell: React.FC<{ children: React.ReactNode; width?: string }> = ({ children, width = 'max-w-7xl' }) => (
  <div className="min-h-[calc(100vh-3rem)] py-6 sm:py-8">
    <div className={`mx-auto ${width} px-4 sm:px-6`}>{children}</div>
  </div>
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; children?: React.ReactNode }> = ({ title, subtitle, children }) => (
  <header className="mb-5 text-center">
    <h1 className="text-balance text-2xl font-bold tracking-tight text-primary-950 dark:text-ember-300 sm:text-3xl">{title}</h1>
    {subtitle && <p className="mx-auto mt-1.5 max-w-prose text-sm text-primary-700 dark:text-primary-300">{subtitle}</p>}
    {children && <div className="mt-5 flex justify-center">{children}</div>}
  </header>
);

/** A strip of figures divided by hairlines, like one row of a ledger. */
export const StatStrip: React.FC<{ items: { label: string; value: React.ReactNode }[] }> = ({ items }) => (
  <dl className={`grid gap-px overflow-hidden rounded-lg border border-primary-200 bg-primary-200 dark:border-ember-300/10 dark:bg-ember-300/10 ${items.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
    {items.map((s) => (
      <div key={s.label} className="bg-white/90 px-2 py-3 text-center dark:bg-primary-900 sm:px-4 sm:py-3">
        <dd className="font-mono text-xl font-semibold tabular text-primary-950 dark:text-ember-300 sm:text-2xl">{s.value}</dd>
        <dt className="mt-1 text-xs text-primary-600 dark:text-primary-400 sm:text-sm">{s.label}</dt>
      </div>
    ))}
  </dl>
);

export const Avatar: React.FC<{ name?: string; size?: 'md' | 'lg' }> = ({ name = '?', size = 'lg' }) => (
  <span
    aria-hidden="true"
    className={`grid shrink-0 place-items-center rounded-full border font-semibold border-primary-300 bg-primary-50 text-primary-700 dark:border-ember-300/30 dark:bg-ember-300/10 dark:text-ember-300 ${size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-8 w-8 text-sm'}`}
  >
    {name.charAt(0).toUpperCase()}
  </span>
);

/** 0x1a2b…9f8e: a short, copy-friendly form of an id. */
export const shortId = (id?: string) => (id && id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id || '');

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="grid place-items-center py-10" role="status">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-300 border-t-primary-700 dark:border-ember-300/20 dark:border-t-ember-300" />
    <span className="sr-only">{label}</span>
  </div>
);

export const Notice: React.FC<{ tone?: 'error' | 'ok'; children: React.ReactNode }> = ({ tone = 'error', children }) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={`rounded-lg border px-4 py-3 text-sm ${
      tone === 'error'
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300'
    }`}
  >
    {children}
  </div>
);

export const Field: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div className="text-sm text-primary-600 dark:text-primary-400">{label}</div>
    <div className={`mt-1 min-h-[44px] rounded-lg border px-3.5 py-2.5 text-sm border-primary-200 bg-primary-50/60 text-primary-950 dark:border-ember-300/10 dark:bg-primary-950/50 dark:text-ember-200 ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);

/** Oct 30 on a phone, Oct 30, 2026 from the small breakpoint up. */
export const ShortDate: React.FC<{ value: string | Date }> = ({ value }) => {
  const d = new Date(value);
  return (
    <>
      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      <span className="hidden sm:inline">, {d.getFullYear()}</span>
    </>
  );
};
