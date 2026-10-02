import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 20000,
});

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    const url = err.config?.url ?? '';
    if (err.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/me')) onUnauthorized?.();
    return Promise.reject(err);
  },
);

export interface ApiError { message: string; status?: number }

export function toApiError(e: unknown): ApiError {
  if (axios.isAxiosError(e)) {
    if (!e.response) return { message: 'Network problem. Please check your connection and try again.' };
    const msg = (e.response.data as { error?: string } | undefined)?.error;
    return { message: msg ?? 'Something went wrong. Please try again.', status: e.response.status };
  }
  return { message: 'Something went wrong. Please try again.' };
}
export const errorMessage = (e: unknown) => toApiError(e).message;
