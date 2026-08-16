const SEARCH_TERMS = ["meme", "funny meme", "classic meme", "relatable meme", "reaction meme"];
const CACHE_TTL_MS = 10 * 60 * 1000;

interface KlipyMemeItem {
  file: {
    md?: {
      webp?: { url: string };
      png?: { url: string };
    };
  };
}

interface KlipySearchResponse {
  result: boolean;
  data: {
    data: KlipyMemeItem[];
  };
}

let cachedPool: string[] = [];
let cachedAt = 0;

async function fetchKlipyTerm(term: string): Promise<string[]> {
  const appKey = process.env.KLIPY_API_KEY;
  if (!appKey) throw new Error("KLIPY_API_KEY ist nicht gesetzt.");

  const url = new URL(`https://api.klipy.com/api/v1/${appKey}/static-memes/search`);
  url.searchParams.set("q", term);
  url.searchParams.set("per_page", "50");
  url.searchParams.set("customer_id", "meme-tunes-server");
  url.searchParams.set("content_filter", "medium");

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as KlipySearchResponse;
  if (!data.result) return [];

  return data.data.data.map((item) => item.file.md?.webp?.url ?? item.file.md?.png?.url).filter((url): url is string => Boolean(url));
}

async function refreshPool(): Promise<void> {
  const results = await Promise.allSettled(SEARCH_TERMS.map(fetchKlipyTerm));
  const urls = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (urls.length > 0) {
    cachedPool = Array.from(new Set(urls));
    cachedAt = Date.now();
  }
}

export async function getRandomMemes(usedUrls: Set<string>, count: number): Promise<string[]> {
  if (cachedPool.length === 0 || Date.now() - cachedAt > CACHE_TTL_MS) {
    await refreshPool();
  }

  let candidates = cachedPool.filter((url) => !usedUrls.has(url));
  if (candidates.length < count) {
    await refreshPool();
    candidates = cachedPool.filter((url) => !usedUrls.has(url));
  }
  if (candidates.length < count) {
    candidates = cachedPool; // fallback: allow repeats if pool exhausted
  }
  if (candidates.length === 0) {
    throw new Error("Kein Meme gefunden.");
  }

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
