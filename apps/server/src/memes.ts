import { readdir } from "node:fs/promises";
import path from "node:path";

const GIPHY_SEARCH_TERMS = ["meme", "funny meme", "classic meme", "relatable meme", "reaction meme"];
const CACHE_TTL_MS = 10 * 60 * 1000;

// apps/server is the cwd when run via `npm run <script> -w apps/server`, both
// locally and on Render, so the repo root is two levels up from there. Using
// a relative default (instead of a hardcoded Windows path) means this works
// the same regardless of OS or deployment location.
const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
export const LOCAL_MEMES_DIR = process.env.LOCAL_MEMES_DIR ?? path.join(REPO_ROOT, "MEMES");
const LOCAL_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const LOCAL_MEDIA_EXTENSIONS = new Set([...LOCAL_IMAGE_EXTENSIONS, ".mp4", ".webm", ".mov"]);

interface GiphyGif {
  title: string;
  images: {
    original: { url: string };
    downsized: { url: string };
  };
}

interface GiphySearchResponse {
  data: GiphyGif[];
}

let giphyPool: string[] = [];
let giphyCachedAt = 0;
const giphyTitles = new Map<string, string>();

export function getGiphyTitle(url: string): string | null {
  return giphyTitles.get(url) ?? null;
}

async function fetchGiphyTerm(term: string): Promise<string[]> {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) throw new Error("GIPHY_API_KEY ist nicht gesetzt.");

  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", term);
  url.searchParams.set("limit", "25");
  url.searchParams.set("rating", "pg-13");
  url.searchParams.set("lang", "de");

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as GiphySearchResponse;
  const urls: string[] = [];
  for (const gif of data.data) {
    const gifUrl = gif.images.downsized.url ?? gif.images.original.url;
    if (!gifUrl) continue;
    urls.push(gifUrl);
    if (gif.title) giphyTitles.set(gifUrl, gif.title);
  }
  return urls;
}

async function refreshGiphyPool(): Promise<void> {
  const results = await Promise.allSettled(GIPHY_SEARCH_TERMS.map(fetchGiphyTerm));
  const urls = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (urls.length > 0) {
    giphyPool = Array.from(new Set(urls));
    giphyCachedAt = Date.now();
  }
}

export async function getRandomGiphyMemes(usedUrls: Set<string>, count: number): Promise<string[]> {
  if (giphyPool.length === 0 || Date.now() - giphyCachedAt > CACHE_TTL_MS) {
    await refreshGiphyPool();
  }

  let candidates = giphyPool.filter((url) => !usedUrls.has(url));
  if (candidates.length < count) {
    await refreshGiphyPool();
    candidates = giphyPool.filter((url) => !usedUrls.has(url));
  }
  if (candidates.length < count) {
    candidates = giphyPool; // fallback: allow repeats if pool exhausted
  }
  if (candidates.length === 0) {
    throw new Error("Kein Meme gefunden.");
  }

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

let localPool: string[] = [];
let localCachedAt = 0;

async function refreshLocalPool(): Promise<void> {
  try {
    const files = await readdir(LOCAL_MEMES_DIR);
    localPool = files.filter((f) => LOCAL_MEDIA_EXTENSIONS.has(path.extname(f).toLowerCase()));
    localCachedAt = Date.now();
  } catch (err) {
    console.error(`Konnte lokalen Meme-Ordner nicht lesen (${LOCAL_MEMES_DIR}):`, err);
    localPool = [];
  }
}

export async function getRandomLocalMemes(usedUrls: Set<string>, count: number): Promise<string[]> {
  if (localPool.length === 0 || Date.now() - localCachedAt > CACHE_TTL_MS) {
    await refreshLocalPool();
  }

  const toUrl = (filename: string) => `/local-memes/${encodeURIComponent(filename)}`;
  let candidates = localPool.map(toUrl).filter((url) => !usedUrls.has(url));
  if (candidates.length < count) {
    await refreshLocalPool();
    candidates = localPool.map(toUrl).filter((url) => !usedUrls.has(url));
  }
  if (candidates.length < count) {
    candidates = localPool.map(toUrl); // fallback: allow repeats if pool exhausted
  }
  if (candidates.length === 0) {
    throw new Error(`Keine lokalen Memes gefunden in ${LOCAL_MEMES_DIR}.`);
  }

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

const BACKGROUND_LOCAL_RATIO = 0.7;

export async function getBackgroundImagePool(count: number): Promise<string[]> {
  if (localPool.length === 0 || Date.now() - localCachedAt > CACHE_TTL_MS) {
    await refreshLocalPool();
  }

  const localImages = localPool.filter((f) => LOCAL_IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
  const localCount = Math.min(localImages.length, Math.round(count * BACKGROUND_LOCAL_RATIO));
  const localUrls = [...localImages]
    .sort(() => Math.random() - 0.5)
    .slice(0, localCount)
    .map((filename) => `/local-memes/${encodeURIComponent(filename)}`);

  const giphyCount = count - localUrls.length;
  let giphyUrls: string[] = [];
  if (giphyCount > 0) {
    try {
      giphyUrls = await getRandomGiphyMemes(new Set(), giphyCount);
    } catch (err) {
      console.error("Konnte Giphy-Bilder für den Hintergrundpool nicht laden:", err);
    }
  }

  return [...localUrls, ...giphyUrls].sort(() => Math.random() - 0.5);
}
