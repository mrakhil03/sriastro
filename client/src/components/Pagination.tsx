import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui';

export default function Pagination({ page, pageSize, total, onChange }: { page: number; pageSize: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted">Showing {from}–{to} of {total}</p>
      <div className="flex gap-2">
        <Button variant="secondary" className="h-9 px-3" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></Button>
        <Button variant="secondary" className="h-9 px-3" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></Button>
      </div>
    </div>
  );
}
