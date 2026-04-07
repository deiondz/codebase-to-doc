import { randomUUID } from "node:crypto";

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 64;
const MAX_BYTES = 48 * 1024 * 1024;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Stored {
  buffer: Buffer;
  expires: number;
  filename: string;
}

/**
 * Next can load this module in more than one bundle (e.g. different route entrypoints).
 * A plain module-level `Map` would not be shared, so GET would miss what POST stored.
 * One Map on `globalThis` matches the usual Prisma-style singleton pattern.
 */
function getStore(): Map<string, Stored> {
  const g = globalThis as unknown as {
    __codebaseExportStore?: Map<string, Stored>;
  };
  if (!g.__codebaseExportStore) {
    g.__codebaseExportStore = new Map();
  }
  return g.__codebaseExportStore;
}

function prune(store: Map<string, Stored>): void {
  const now = Date.now();
  for (const [id, v] of store) {
    if (v.expires <= now) {
      store.delete(id);
    }
  }
  while (store.size > MAX_ENTRIES) {
    const first = store.keys().next().value;
    if (first) {
      store.delete(first);
    }
  }
}

export function putExportResult(buffer: Buffer, filename: string): string {
  const store = getStore();
  prune(store);
  if (buffer.length > MAX_BYTES) {
    throw new Error("Export result is too large to retrieve.");
  }
  const id = randomUUID();
  store.set(id, {
    buffer,
    filename,
    expires: Date.now() + TTL_MS,
  });
  return id;
}

export function takeExportResult(id: string): Stored | null {
  const store = getStore();
  prune(store);
  if (!UUID_RE.test(id)) {
    return null;
  }
  const v = store.get(id);
  if (!v || v.expires <= Date.now()) {
    if (v) {
      store.delete(id);
    }
    return null;
  }
  store.delete(id);
  return v;
}
