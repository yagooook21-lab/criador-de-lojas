// Hostinger / Express MySQL API Client Adapter replacing Supabase

const API_BASE = typeof window !== 'undefined' 
  ? (window.location.origin.includes('localhost') ? 'http://localhost:3001' : '') 
  : '';

class QueryBuilder {
  private tableName: string;
  private method: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' = 'SELECT';
  private selectedColumns: string = '*';
  private isCountOnly: boolean = false;
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private orders: Array<{ column: string; ascending: boolean }> = [];
  private limitCount?: number;
  private offsetCount?: number;
  private isSingle: boolean = false;
  private payloadData: any = null;
  private upsertConflictKey?: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*', options?: { count?: string; head?: boolean }) {
    this.selectedColumns = columns;
    if (options?.head && options?.count) {
      this.isCountOnly = true;
    }
    return this;
  }

  insert(data: any) {
    this.method = 'INSERT';
    this.payloadData = data;
    return this;
  }

  upsert(data: any, options?: { onConflict?: string }) {
    this.method = 'INSERT';
    this.payloadData = data;
    if (options?.onConflict) {
      this.upsertConflictKey = options.onConflict;
    }
    return this;
  }

  update(data: any) {
    this.method = 'UPDATE';
    this.payloadData = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  or(filtersStr: string) {
    if (typeof filtersStr === 'string') {
      this.filters.push({ column: '', operator: 'or', value: filtersStr, raw: filtersStr });
    }
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, value: any) {
    this.filters.push({ column, operator: 'like', value });
    return this;
  }

  ilike(column: string, value: any) {
    this.filters.push({ column, operator: 'ilike', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ column, operator: 'is', value });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = { ascending: true }) {
    this.orders.push({ column, ascending: options.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  async then(resolve?: (value: any) => void, reject?: (reason?: any) => void) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('hostinger_auth_token') : null;
      const res = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          table: this.tableName,
          method: this.method,
          select: this.selectedColumns,
          filters: this.filters,
          orders: this.orders,
          limit: this.limitCount,
          offset: this.offsetCount,
          single: this.isSingle,
          countOnly: this.isCountOnly,
          data: this.payloadData,
          upsertOnConflict: this.upsertConflictKey
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Request failed' }));
        const error = errJson.error || { message: `HTTP ${res.status}: ${res.statusText}` };
        const result = { data: null, error };
        if (resolve) resolve(result);
        return result;
      }

      const result = await res.json();
      if (resolve) resolve(result);
      return result;
    } catch (err: any) {
      const result = { data: null, error: { message: err.message || 'Network error' } };
      if (resolve) resolve(result);
      return result;
    }
  }
}

class AuthClient {
  private listeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        this.notify('TOKEN_REFRESHED');
      });
    }
  }

  private notify(event: string) {
    const session = this.getSessionData();
    this.listeners.forEach(fn => fn(event, session));
  }

  private getSessionData() {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('hostinger_auth_token');
    const userStr = localStorage.getItem('hostinger_auth_user');
    if (!token || !userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return { access_token: token, user };
    } catch (e) {
      return null;
    }
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { data: { user: null, session: null }, error: data.error || { message: 'Login failed' } };
      }
      localStorage.setItem('hostinger_auth_token', data.access_token);
      localStorage.setItem('hostinger_auth_user', JSON.stringify(data.user));
      this.notify('SIGNED_IN');
      return { data: { user: data.user, session: { access_token: data.access_token, user: data.user } }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message } };
    }
  }

  async signUp({ email, password }: { email: string; password: string }) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { data: { user: null, session: null }, error: data.error || { message: 'Signup failed' } };
      }
      localStorage.setItem('hostinger_auth_token', data.access_token);
      localStorage.setItem('hostinger_auth_user', JSON.stringify(data.user));
      this.notify('SIGNED_IN');
      return { data: { user: data.user, session: { access_token: data.access_token, user: data.user } }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message } };
    }
  }

  async signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hostinger_auth_token');
      localStorage.removeItem('hostinger_auth_user');
    }
    this.notify('SIGNED_OUT');
    return { error: null };
  }

  async getSession() {
    const session = this.getSessionData();
    return { data: { session }, error: null };
  }

  async getUser() {
    const session = this.getSessionData();
    return { data: { user: session?.user || null }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    const session = this.getSessionData();
    if (session) {
      callback('INITIAL_SESSION', session);
    }
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        }
      }
    };
  }
}

class StorageClient {
  from(bucket: string) {
    return {
      upload: async (path: string, file: any) => {
        return { data: { path: `${bucket}/${path}` }, error: null };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: path.startsWith('http') ? path : `/uploads/${path}` } };
      }
    };
  }
}

// Channel mock for realtime
class RealtimeChannel {
  on(type: string, filter: any, callback: Function) {
    return this;
  }
  subscribe() {
    return this;
  }
}

class HostingerClient {
  auth = new AuthClient();
  storage = new StorageClient();

  from(table: string) {
    return new QueryBuilder(table);
  }

  channel(name: string) {
    return new RealtimeChannel();
  }

  removeChannel(channel: any) {
    return true;
  }
}

export const supabase = new HostingerClient();
export default supabase;