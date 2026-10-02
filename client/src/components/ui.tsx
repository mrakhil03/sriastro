import { ButtonHTMLAttributes, createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaymentStatus, ReadingStatus } from '../types';
import { cn } from '../utils';

/* ---------- Buttons ---------- */
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 h-11 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap';
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-600 shadow-sm',
  secondary: 'bg-white text-ink border border-line hover:bg-canvas',
  danger: 'bg-bad text-white hover:bg-red-700',
  ghost: 'text-muted hover:bg-black/5',
};
export const buttonClass = (v: Variant = 'primary', extra = '') => cn(base, variants[v], extra);

export function Button({ variant = 'primary', loading, children, className, disabled, ...p }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button {...p} disabled={disabled || loading} className={buttonClass(variant, className)}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* ---------- Surfaces ---------- */
export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn('bg-white border border-line rounded-2xl shadow-soft', className)}>{children}</div>
);

export const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => (
  <span aria-hidden className={cn('shrink-0 grid place-items-center rounded-full bg-brand-50 text-brand-700 font-bold',
    size === 'sm' ? 'size-8 text-sm' : size === 'lg' ? 'size-14 text-xl' : 'size-11 text-base')}>
    {(name.trim()[0] ?? '?').toUpperCase()}
  </span>
);

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: LucideIcon; accent?: boolean }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        <span className={cn('grid place-items-center size-9 rounded-xl', accent ? 'bg-brand text-white' : 'bg-brand-50 text-brand-700')}>
          <Icon className="size-4.5" aria-hidden />
        </span>
      </div>
      <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight break-words">{value}</div>
    </Card>
  );
}

/* ---------- Badges ---------- */
export function Badge({ tone, children }: { tone: 'success' | 'pending' | 'neutral'; children: ReactNode }) {
  const t = { success: 'bg-green-50 text-green-700 ring-green-600/20', pending: 'bg-amber-50 text-amber-800 ring-amber-600/20', neutral: 'bg-gray-100 text-gray-700 ring-gray-500/20' }[tone];
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap', t)}>{children}</span>;
}
export const PaymentBadge = ({ status }: { status: PaymentStatus }) =>
  status === 'PAID' ? <Badge tone="success"><CheckCircle2 className="size-3.5" aria-hidden />Paid</Badge> : <Badge tone="pending"><Clock className="size-3.5" aria-hidden />Not Paid</Badge>;
export const ReadingBadge = ({ status }: { status: ReadingStatus }) =>
  status === 'COMPLETED' ? <Badge tone="success"><CheckCircle2 className="size-3.5" aria-hidden />Completed</Badge> : <Badge tone="neutral">Not Read</Badge>;

/* ---------- Feedback ---------- */
export const Spinner = ({ className }: { className?: string }) => <Loader2 className={cn('animate-spin text-brand', className ?? 'size-5')} aria-hidden />;

export const Loading = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status"><Spinner /> {label}</div>
);

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <span className="mx-auto grid place-items-center size-14 rounded-full bg-brand-50 text-brand"><Icon className="size-6" aria-hidden /></span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-muted max-w-sm mx-auto">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-14 px-6" role="alert">
      <span className="mx-auto grid place-items-center size-14 rounded-full bg-red-50 text-bad"><AlertCircle className="size-6" aria-hidden /></span>
      <p className="mt-4 font-medium">{message}</p>
      {onRetry && <Button variant="secondary" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/* ---------- Toasts ---------- */
type Toast = { id: number; kind: 'success' | 'error'; text: string };
const ToastCtx = createContext<{ success: (t: string) => void; error: (t: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4000);
  }, []);
  const api = useRef({ success: (t: string) => push('success', t), error: (t: string) => push('error', t) }).current;
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed z-[100] top-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-96 flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cn('pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg', t.kind === 'success' ? 'border-green-200' : 'border-red-200')}>
            {t.kind === 'success' ? <CheckCircle2 className="size-5 text-ok shrink-0" aria-hidden /> : <AlertCircle className="size-5 text-bad shrink-0" aria-hidden />}
            <p className="flex-1 text-sm font-medium">{t.text}</p>
            <button onClick={() => setItems((x) => x.filter((i) => i.id !== t.id))} aria-label="Dismiss" className="text-muted hover:text-ink"><X className="size-4" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error('useToast must be used inside ToastProvider');
  return c;
}

/* ---------- Modal (native <dialog>: focus trap + Esc built in) ---------- */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 shadow-2xl">
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink -mt-1 -mr-1 p-1"><X className="size-5" /></button>
          </div>
          <div className="mt-3">{children}</div>
        </div>
      )}
    </dialog>
  );
}

/* ---------- Form field ---------- */
export function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
      {error && <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-sm text-bad">{error}</p>}
    </div>
  );
}
export const inputClass = (hasError?: boolean, withIcon = true) =>
  cn('w-full h-12 rounded-xl border bg-white text-base placeholder:text-gray-400 transition-shadow focus:outline-none focus:ring-2',
    withIcon ? 'pl-11 pr-4' : 'px-4',
    hasError ? 'border-bad focus:ring-red-200' : 'border-line focus:border-brand focus:ring-brand/25');
