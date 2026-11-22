import { Hymn, HymnBook } from '../types/church';

const DB_NAME = 'gpi_getsemani_kidung_db';
const DB_VERSION = 1;
const STORE_HYMNS = 'hymns';
const STORE_META = 'meta';
const DATASET_VERSION = '2026-11-full-v1';

const LEGACY_SAMPLE_IDS = new Set([
  'nr-1',
  'kj-1',
  'kj-2',
  'kj-3',
  'kj-64',
  'pkj-1',
  'pkj-2',
  'nkb-3',
  'dsl-12',
  'kj-24',
  'kj-36',
  'nkb-15',
  'pkj-15',
  'dsl-25',
]);

const BOOK_ORDER: Record<HymnBook, number> = {
  KJ: 1,
  PKJ: 2,
  NKB: 3,
  DSL: 4,
  NR: 5,
};

export interface KidungDbStats {
  cachedHymnsCount: number;
  booksCount: Record<HymnBook, number>;
  lastUpdatedAt: string | null;
  isOfflineReady: boolean;
}

// Minimal emergency fallback if dynamic collection chunk fails
export const DEFAULT_OFFLINE_HYMNS: Hymn[] = [
  {
    id: 'kj-1',
    book: 'KJ',
    number: 1,
    title: 'Haleluya, Pujilah',
    keySignature: '1=F · 4/4',
    chorus: 'Haleluya! Pujilah Allah Yang Agung, Maha Esa!\nDalam Kristus kita kenal Allah Yang Hidup, Bapa kekal!',
    verses: [
      {
        number: 1,
        text: 'Langit, buana semesta patut memuji kuasaNya,\nkarna berkatNya tak henti, limpah kasihNya tak terperi.',
      },
      {
        number: 2,
        text: 'Wahai dunia, soraklah! Angkat suaramu, nyanyilah!\nTabuhlah tifa dan gendang, iringi puji dalam tembang!',
      },
    ],
  },
];

let cachedFullCollection: Hymn[] | null = null;

export async function loadFullKidungCollection(): Promise<Hymn[]> {
  if (cachedFullCollection) return cachedFullCollection;
  try {
    const mod = await import('../data/kidungCollection.json');
    const list = (mod.default || mod) as Hymn[];
    if (Array.isArray(list) && list.length > 0) {
      cachedFullCollection = list;
      return list;
    }
  } catch {
    // Fall back cleanly if chunk fails to load
  }
  return DEFAULT_OFFLINE_HYMNS;
}

function sortHymns(list: Hymn[]): Hymn[] {
  return [...list].sort((a, b) => {
    const orderA = BOOK_ORDER[a.book] ?? 99;
    const orderB = BOOK_ORDER[b.book] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    if (a.number !== b.number) return a.number - b.number;
    return (a.codeLabel || '').localeCompare(b.codeLabel || '');
  });
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
let memoryFallbackHymns: Hymn[] = [];

function openKidungDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_HYMNS)) {
          db.createObjectStore(STORE_HYMNS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

async function getMetaValue(db: IDBDatabase, key: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_META, 'readonly');
      const req = tx.objectStore(STORE_META).get(key);
      req.onsuccess = () => resolve(req.result ? (req.result.value as string) : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readAllRawFromDb(db: IDBDatabase): Promise<Hymn[]> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_HYMNS, 'readonly');
      const req = tx.objectStore(STORE_HYMNS).getAll();
      req.onsuccess = () => resolve((req.result || []) as Hymn[]);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function getAllHymnsFromDb(): Promise<Hymn[]> {
  const db = await openKidungDb();
  if (!db) {
    if (memoryFallbackHymns.length === 0) {
      memoryFallbackHymns = await loadFullKidungCollection();
    }
    return memoryFallbackHymns;
  }

  const [existing, storedVersion] = await Promise.all([
    readAllRawFromDb(db),
    getMetaValue(db, 'datasetVersion'),
  ]);

  if (existing.length > 0 && storedVersion === DATASET_VERSION) {
    return sortHymns(existing);
  }

  // Initial seed or upgrade from legacy 9-14 song seed to full KJ/PKJ/NKB/DSL/NR collection
  const fullPack = await loadFullKidungCollection();
  const map = new Map<string, Hymn>();

  fullPack.forEach((h) => map.set(h.id, h));
  existing.forEach((h) => {
    if (!LEGACY_SAMPLE_IDS.has(h.id) && !map.has(h.id)) {
      map.set(h.id, h);
    }
  });

  const merged = sortHymns(Array.from(map.values()));
  await saveHymnsToDb(merged);
  return merged;
}

export async function saveHymnsToDb(hymns: Hymn[]): Promise<void> {
  const sorted = sortHymns(hymns);
  memoryFallbackHymns = [...sorted];
  const db = await openKidungDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_HYMNS, STORE_META], 'readwrite');
      const store = tx.objectStore(STORE_HYMNS);
      store.clear();
      sorted.forEach((h) => store.put(h));

      const metaStore = tx.objectStore(STORE_META);
      metaStore.put({ key: 'lastUpdatedAt', value: new Date().toISOString() });
      metaStore.put({ key: 'datasetVersion', value: DATASET_VERSION });

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function addOrUpdateHymnInDb(hymn: Hymn): Promise<void> {
  const all = await getAllHymnsFromDb();
  const idx = all.findIndex((x) => x.id === hymn.id);
  if (idx >= 0) {
    all[idx] = hymn;
  } else {
    all.push(hymn);
  }
  await saveHymnsToDb(all);
}

export async function deleteHymnFromDb(id: string): Promise<void> {
  const all = await getAllHymnsFromDb();
  const filtered = all.filter((x) => x.id !== id);
  await saveHymnsToDb(filtered);
}

export async function getKidungDbStats(): Promise<KidungDbStats> {
  const hymns = await getAllHymnsFromDb();
  const booksCount: Record<HymnBook, number> = {
    KJ: 0,
    PKJ: 0,
    NKB: 0,
    DSL: 0,
    NR: 0,
  };

  hymns.forEach((h) => {
    if (booksCount[h.book] !== undefined) {
      booksCount[h.book]++;
    }
  });

  let lastUpdatedAt: string | null = null;
  const db = await openKidungDb();
  if (db) {
    lastUpdatedAt = await getMetaValue(db, 'lastUpdatedAt');
  }

  return {
    cachedHymnsCount: hymns.length,
    booksCount,
    lastUpdatedAt,
    isOfflineReady: hymns.length >= 1000,
  };
}

export async function importKidungFromJsonString(jsonStr: string): Promise<{ count: number; error?: string }> {
  try {
    const parsed = JSON.parse(jsonStr);
    let items: Hymn[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.hymns)) {
      items = parsed.hymns;
    } else {
      return { count: 0, error: 'Format JSON tidak valid (harus berupa array lagu atau objek dengan properti hymns).' };
    }

    const validated: Hymn[] = items.map((h, idx) => ({
      id: h.id || `${(h.book || 'KJ').toLowerCase()}-${h.number || idx + 1}`,
      book: (h.book || 'KJ').toUpperCase() as HymnBook,
      number: Number(h.number) || idx + 1,
      ...(h.codeLabel ? { codeLabel: h.codeLabel } : {}),
      title: h.title || `Kidung Tanpa Judul ${idx + 1}`,
      keySignature: h.keySignature || 'Do = C',
      chorus: h.chorus,
      verses: Array.isArray(h.verses) && h.verses.length > 0 ? h.verses : [{ number: 1, text: (h as any).text || '' }],
    }));

    const existing = await getAllHymnsFromDb();
    const map = new Map<string, Hymn>();
    existing.forEach((h) => map.set(h.id, h));
    validated.forEach((h) => map.set(h.id, h));

    const merged = sortHymns(Array.from(map.values()));
    await saveHymnsToDb(merged);
    return { count: validated.length };
  } catch (err: any) {
    return { count: 0, error: err?.message || 'Gagal mem-parsing file JSON.' };
  }
}

export async function exportKidungAsJsonString(): Promise<string> {
  const hymns = await getAllHymnsFromDb();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      source: 'GPI Getsemani Sorong - Kidung Pujian Offline Pack',
      totalCount: hymns.length,
      hymns,
    },
    null,
    2
  );
}

// Download & update full offline collection across KJ, PKJ, NKB, DSL, NR
export async function downloadFullKidungPackOffline(): Promise<{ count: number }> {
  const db = await openKidungDb();
  const existing = db ? await readAllRawFromDb(db) : memoryFallbackHymns;
  const fullPack = await loadFullKidungCollection();

  const map = new Map<string, Hymn>();
  existing.forEach((h) => {
    if (!LEGACY_SAMPLE_IDS.has(h.id)) {
      map.set(h.id, h);
    }
  });
  fullPack.forEach((h) => map.set(h.id, h));

  const merged = sortHymns(Array.from(map.values()));
  await saveHymnsToDb(merged);
  return { count: merged.length };
}
