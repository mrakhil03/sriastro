import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Inbox, Search, SearchX, Users } from 'lucide-react';
import { useApi, useDebounce } from '../hooks';
import { Avatar, buttonClass, Card, EmptyState, ErrorState, Loading, PageHeader, PaymentBadge, ReadingBadge } from '../components/ui';
import Pagination from '../components/Pagination';
import type { Client, Paged } from '../types';
import { formatDate, formatDob, formatTime12, inr } from '../utils';

const select = 'h-11 rounded-xl border border-line bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:border-brand focus:ring-brand/25';

export default function ClientsList({ variant }: { variant: 'requests' | 'clients' }) {
  const isReq = variant === 'requests';
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState('ALL');
  const [reading, setReading] = useState('ALL');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim());

  useEffect(() => setPage(1), [q, payment, reading, sort]);

  const { data, error, loading, reload } = useApi<Paged<Client>>('/admin/clients', {
    search: q || undefined, payment, reading, sort, page, pageSize: 15, recent: isReq ? 'true' : undefined,
  });
  const filtered = !!q || payment !== 'ALL' || reading !== 'ALL';
  const open = (id: string) => navigate(`/admin/clients/${id}`);

  return (
    <>
      <PageHeader title={isReq ? 'New Requests' : 'Clients'}
        subtitle={isReq ? 'Birth details submitted in the last 7 days, newest first.' : 'Everyone who has submitted their birth details.'} />

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-gray-400" aria-hidden />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." aria-label="Search clients"
            className="w-full h-11 rounded-xl border border-line bg-white pl-11 pr-4 text-base focus:outline-none focus:ring-2 focus:border-brand focus:ring-brand/25" />
        </div>
        {!isReq && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <select className={select} value={payment} onChange={(e) => setPayment(e.target.value)} aria-label="Payment filter">
              <option value="ALL">Payment: All</option><option value="PAID">Paid</option><option value="NOT_PAID">Not Paid</option>
            </select>
            <select className={select} value={reading} onChange={(e) => setReading(e.target.value)} aria-label="Reading filter">
              <option value="ALL">Reading: All</option><option value="COMPLETED">Completed</option><option value="NOT_READ">Not Read</option>
            </select>
            <select className={`${select} col-span-2 sm:col-span-1`} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="newest">Newest</option><option value="oldest">Oldest</option>
              <option value="amount_desc">Highest Amount</option><option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        )}
      </div>

      {!data ? (error ? <ErrorState message={error.message} onRetry={reload} /> : <Loading label="Loading clients..." />) : data.items.length === 0 ? (
        <Card>
          {filtered ? <EmptyState icon={SearchX} title="No matching clients" text="Try a different search or clear the filters." />
            : isReq ? <EmptyState icon={Inbox} title="No New Requests" text="New birth-detail submissions from the last 7 days will appear here." />
            : <EmptyState icon={Users} title="No Clients Yet" text="Customer birth details will appear here after submission." />}
        </Card>
      ) : (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
          {/* Desktop table */}
          <Card className="hidden xl:block overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th><th className="px-3 py-3 font-semibold">DOB</th>
                  <th className="px-3 py-3 font-semibold">Birth Time</th><th className="px-3 py-3 font-semibold">Birth Place</th>
                  {!isReq && <th className="px-3 py-3 font-semibold">Amount</th>}
                  <th className="px-3 py-3 font-semibold">Payment</th><th className="px-3 py-3 font-semibold">Reading</th>
                  <th className="px-3 py-3 font-semibold">Created</th><th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((c) => (
                  <tr key={c.id} onClick={() => open(c.id)} className="hover:bg-canvas cursor-pointer">
                    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><Avatar name={c.name} size="sm" /><span className="font-semibold">{c.name}</span></div></td>
                    <td className="px-3 py-3.5 whitespace-nowrap">{formatDob(c.dateOfBirth)}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap">{formatTime12(c.birthTime)}</td>
                    <td className="px-3 py-3.5">{c.birthPlace}</td>
                    {!isReq && <td className="px-3 py-3.5 font-semibold">{c.amount > 0 ? inr(c.amount) : '—'}</td>}
                    <td className="px-3 py-3.5"><PaymentBadge status={c.paymentStatus} /></td>
                    <td className="px-3 py-3.5"><ReadingBadge status={c.readingStatus} /></td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-muted">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/admin/clients/${c.id}`} onClick={(e) => e.stopPropagation()} className={buttonClass('secondary', 'h-9 px-3')}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile / tablet cards */}
          <div className="xl:hidden grid gap-3 md:grid-cols-2">
            {data.items.map((c) => (
              <Link key={c.id} to={`/admin/clients/${c.id}`} className="block">
                <Card className="p-4 hover:border-brand/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{c.name}</p>
                      <p className="text-sm text-muted">{formatDob(c.dateOfBirth)} • {formatTime12(c.birthTime)}</p>
                      <p className="text-sm text-muted truncate">{c.birthPlace}</p>
                    </div>
                    {!isReq && <span className="font-bold">{c.amount > 0 ? inr(c.amount) : '—'}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <PaymentBadge status={c.paymentStatus} /><ReadingBadge status={c.readingStatus} />
                    <span className="ml-auto text-xs text-muted">{formatDate(c.createdAt)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} />
        </div>
      )}
    </>
  );
}
