export type PaymentStatus = 'PAID' | 'NOT_PAID';
export type ReadingStatus = 'COMPLETED' | 'NOT_READ';

export interface Client {
  id: string;
  name: string;
  dateOfBirth: string;
  birthTime: string;
  birthPlace: string;
  prediction: string | null;
  amount: number;
  paymentStatus: PaymentStatus;
  readingStatus: ReadingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }

export interface MoneySummary { totalCollection: number; todayCollection: number; totalTransactions: number; pendingCollection: number }

export interface TransactionItem { id: string; clientId: string; clientName: string; amount: number; description: string; createdAt: string }

export interface PaymentItem { id: string; name: string; amount: number; paymentStatus: PaymentStatus; createdAt: string; paidAt: string | null }
