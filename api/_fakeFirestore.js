// Firestore de mentira, só para os testes (o prefixo `_` já mantém o arquivo fora das
// funções serverless da Vercel). Cobre o que os endpoints de reembolso usam: doc/collection
// aninhados, where/limit, add, e runTransaction com get/set/create — incluindo o
// ALREADY_EXISTS do `create`, que é a trava de idempotência do webhook.

function cloneValue(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

class FakeDocRef {
  constructor(store, path) {
    this.store = store;
    this.path = path;
    this.id = path.split('/').pop();
  }

  collection(name) {
    return new FakeCollectionRef(this.store, `${this.path}/${name}`);
  }

  snapshot() {
    const data = this.store.get(this.path);
    return {
      id: this.id,
      ref: this,
      exists: data !== undefined,
      data: () => cloneValue(data),
    };
  }

  async get() {
    return this.snapshot();
  }

  async set(data, options) {
    const previous = this.store.get(this.path);
    const merged = options?.merge && previous ? { ...previous, ...cloneValue(data) } : cloneValue(data);
    this.store.set(this.path, merged);
  }

  async create(data) {
    if (this.store.has(this.path)) {
      const error = new Error(`6 ALREADY_EXISTS: entity already exists: ${this.path}`);
      error.code = 6;
      throw error;
    }
    this.store.set(this.path, cloneValue(data));
  }
}

class FakeQuery {
  constructor(store, path, filters = [], max = null) {
    this.store = store;
    this.path = path;
    this.filters = filters;
    this.max = max;
  }

  where(field, op, value) {
    if (op !== '==') throw new Error(`operador não suportado no fake: ${op}`);
    return new FakeQuery(this.store, this.path, [...this.filters, { field, value }], this.max);
  }

  limit(max) {
    return new FakeQuery(this.store, this.path, this.filters, max);
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = [];
    for (const [path, data] of this.store.entries()) {
      if (!path.startsWith(prefix)) continue;
      // Só filhos diretos: `refundRequests/X` entra, `refundRequests/X/events/Y` não.
      if (path.slice(prefix.length).includes('/')) continue;
      if (!this.filters.every((filter) => data[filter.field] === filter.value)) continue;
      docs.push(new FakeDocRef(this.store, path).snapshot());
      if (this.max && docs.length >= this.max) break;
    }
    return { docs, empty: docs.length === 0, size: docs.length };
  }
}

class FakeCollectionRef extends FakeQuery {
  doc(id) {
    const docId = id || `auto_${Math.random().toString(36).slice(2, 10)}`;
    return new FakeDocRef(this.store, `${this.path}/${docId}`);
  }

  async add(data) {
    const ref = this.doc();
    await ref.set(data);
    return ref;
  }
}

export function createFakeDb(seed = {}) {
  const store = new Map(Object.entries(seed).map(([path, data]) => [path, cloneValue(data)]));

  return {
    store,
    collection(name) {
      return new FakeCollectionRef(store, name);
    },
    // Sem isolamento de verdade: as escritas valem na hora. É o bastante para exercitar as
    // travas de status, que é o que os testes verificam.
    async runTransaction(handler) {
      const tx = {
        get: (target) => target.get(),
        set: (ref, data, options) => { ref.set(data, options); },
        create: (ref, data) => {
          if (store.has(ref.path)) {
            const error = new Error(`6 ALREADY_EXISTS: entity already exists: ${ref.path}`);
            error.code = 6;
            throw error;
          }
          store.set(ref.path, cloneValue(data));
        },
      };
      return handler(tx);
    },
  };
}

export function docsUnder(db, prefix) {
  return [...db.store.keys()].filter((path) => path.startsWith(prefix));
}
