// MongoDB API Client - Replaces Supabase with REST calls to the local Express server.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
console.log('API_BASE configured as:', API_BASE);

function jsonResponse(res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

const auth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { error: await res.json() };
    const data = await res.json();
    localStorage.setItem('ai_arena_token', data.token);
    localStorage.setItem('ai_arena_user', JSON.stringify(data.user));
    localStorage.setItem('ai_arena_role', data.user?.role || 'participant');
    // Dispatch event asynchronously to allow state to update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('authChange', { detail: { user: data.user } }));
    }, 0);
    return { data };
  },
  async signOut() {
    localStorage.removeItem('ai_arena_token');
    localStorage.removeItem('ai_arena_user');
    localStorage.removeItem('ai_arena_role');
    window.dispatchEvent(new CustomEvent('authChange', { detail: { user: null } }));
  },
  async getSession() {
    const token = localStorage.getItem('ai_arena_token');
    const userStr = localStorage.getItem('ai_arena_user');
    if (!token) return { data: { session: null } };
    return { data: { session: { access_token: token, user: userStr ? JSON.parse(userStr) : null } } };
  },
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const session = detail.user ? { user: detail.user } : null;
      callback('SIGNED_IN', session);
    };
    window.addEventListener('authChange', handler as EventListener);
    const subscription = { unsubscribe: () => window.removeEventListener('authChange', handler as EventListener) };
    // Match Supabase return shape: { data: { subscription } }
    return { data: { subscription } };
  }
};

function from(collection: string) {
  let filters: Array<{ field: string; value: any; op: string }> = [];
  let orderField: string | null = null;
  let orderAsc = true;
  let limitCount: number | null = null;

  const buildUrl = () => {
    const params = new URLSearchParams();
    for (const f of filters) {
      if (f.op === 'eq') params.append(f.field, f.value);
      if (f.op === 'in') params.append(`${f.field}_in`, f.value.join(','));
    }
    const query = params.toString();
    return `${API_BASE}/api/${collection}${query ? `?${query}` : ''}`;
  };

  const executor = {
    select(...fields: string[]) {
      return executor;
    },
    eq(field: string, value: any) {
      filters.push({ field, value, op: 'eq' });
      return executor;
    },
    in(field: string, values: any[]) {
      filters.push({ field, value: values, op: 'in' });
      return executor;
    },
    order(field: string, options?: any) {
      orderField = field;
      orderAsc = options?.ascending !== false;
      return executor;
    },
    limit(n: number) {
      limitCount = n;
      return executor;
    },
    async single() {
      const url = buildUrl();
      const res = await fetch(url);
      const docs = await jsonResponse(res);
      return { data: docs[0] || null, error: null };
    },
    async insert(payload: any) {
      const res = await fetch(`${API_BASE}/api/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      try {
        const data = await jsonResponse(res);
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    update(payload: any) {
      return {
        eq: (field: string, value: any) => ({
          async then(resolve: any, reject: any) {
            try {
              // Optimization: If updating by ID, skip the fetch-search step
              if (field === 'id' || field === '_id') {
                await fetch(`${API_BASE}/api/${collection}/${value}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                resolve({ data: [{ ...payload, id: value }], error: null });
                return;
              }

              const res = await fetch(`${API_BASE}/api/${collection}?${field}=${encodeURIComponent(value)}`);
              const docs = await jsonResponse(res);

              for (const doc of docs) {
                const id = doc._id || doc.id;
                await fetch(`${API_BASE}/api/${collection}/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...doc, ...payload }),
                });
              }
              resolve({ data: docs, error: null });
            } catch (error) {
              reject({ data: null, error });
            }
          }
        })
      } as any;
    },
    async upsert(payload: any[]) {
      try {
        for (const item of payload) {
          const id = item._id || item.id;
          if (id) {
            await fetch(`${API_BASE}/api/${collection}/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
          } else {
            await fetch(`${API_BASE}/api/${collection}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
          }
        }
        return { data: payload, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    then(resolve: any, reject: any) {
      (async () => {
        try {
          const url = buildUrl();
          const res = await fetch(url);
          let data = await jsonResponse(res);

          if (orderField) {
            data = data.sort((a: any, b: any) => {
              const aVal = a[orderField];
              const bVal = b[orderField];
              if (aVal > bVal) return orderAsc ? 1 : -1;
              if (aVal < bVal) return orderAsc ? -1 : 1;
              return 0;
            });
          }

          if (limitCount != null) data = data.slice(0, limitCount);

          resolve({ data, error: null });
        } catch (error) {
          reject({ data: null, error });
        }
      })();
    }
  };

  return executor as any;
}

export const db = {
  auth,
  from,
};

export default db;
