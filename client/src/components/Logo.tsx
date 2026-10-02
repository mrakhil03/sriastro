import { Sparkle } from 'lucide-react';

export default function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`grid place-items-center rounded-xl bg-brand text-white ${size === 'lg' ? 'size-11' : 'size-9'}`}>
        <Sparkle className={size === 'lg' ? 'size-6' : 'size-5'} fill="currentColor" aria-hidden />
      </span>
      <span className={`font-bold tracking-tight ${size === 'lg' ? 'text-2xl' : 'text-xl'}`}>SriAstro</span>
    </span>
  );
}
