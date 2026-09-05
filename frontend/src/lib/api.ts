// Default to relative /api routes so browser clients work behind the Next.js
// rewrite/proxy (including Arena live previews). Set NEXT_PUBLIC_API_URL only
// when the frontend is intentionally hosted on a separate origin.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface FetchOptions extends RequestInit {
  token?: string;
}

// Error that preserves the HTTP status and response body so callers can react
// to specific codes (e.g. 429 with a nextRemindAt payload, 404, 400).
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bazaarsetu_token');
  localStorage.removeItem('bazaarsetu_user');
  localStorage.removeItem('bazaarsetu_role');
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers,
  });

  const body = await res.json().catch(() => ({ message: 'Something went wrong' }));

  // Unauthorized on an authed request — session missing/expired. Clear locally
  // and send to login, unless we're already on the login/splash flow. Tokenless
  // (guest/public) requests that 401 just surface the error to the caller.
  if (res.status === 401) {
    if (token) {
      clearSession();
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/splash') {
          window.location.href = '/login';
        }
      }
      throw new ApiError('Session expired. Please log in again.', 401, body);
    }
    throw new ApiError(body.message || 'Unauthorized', 401, body);
  }

  if (res.status === 403) {
    throw new ApiError('You do not have permission to do that.', 403, body);
  }

  if (!res.ok) {
    throw new ApiError(body.message || `HTTP ${res.status}`, res.status, body);
  }

  return body as T;
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    apiFetch<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body), token }),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), token }),

  patch: <T>(endpoint: string, body: unknown, token?: string) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), token }),

  delete: <T>(endpoint: string, token?: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE', token }),
};

export { API_URL };
