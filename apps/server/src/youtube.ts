import type { YoutubeSearchResult } from "@meme-tunes/shared";

// Trim defensively: a stray trailing space/newline from copy-pasting the key
// into a hosting provider's env var UI makes Google reject it as invalid,
// even though the key itself is correct.
const API_KEY = process.env.YOUTUBE_API_KEY?.trim();

if (API_KEY) {
  console.log(
    `[youtube] API key loaded, length=${API_KEY.length}, starts="${API_KEY.slice(0, 6)}", ends="${API_KEY.slice(-4)}"`,
  );
} else {
  console.error("[youtube] YOUTUBE_API_KEY is not set at startup.");
}

function parseIso8601Duration(duration: string): number {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

interface SearchListItem {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string; thumbnails: { default?: { url: string }; medium?: { url: string } } };
}

interface VideosListItem {
  id: string;
  contentDetails: { duration: string };
}

export async function searchYoutube(query: string): Promise<YoutubeSearchResult[]> {
  if (!API_KEY) {
    throw new Error("YOUTUBE_API_KEY ist nicht gesetzt.");
  }

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("maxResults", "10");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("key", API_KEY);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const body = await searchRes.text().catch(() => "");
    throw new Error(`YouTube-Suche fehlgeschlagen (${searchRes.status}): ${body}`);
  }
  const searchData = (await searchRes.json()) as { items: SearchListItem[] };
  const items = searchData.items.filter((item) => item.id?.videoId);
  if (items.length === 0) return [];

  const videoIds = items.map((item) => item.id.videoId).join(",");
  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "contentDetails");
  videosUrl.searchParams.set("id", videoIds);
  videosUrl.searchParams.set("key", API_KEY);

  const videosRes = await fetch(videosUrl);
  if (!videosRes.ok) {
    const body = await videosRes.text().catch(() => "");
    throw new Error(`YouTube-Videoabfrage fehlgeschlagen (${videosRes.status}): ${body}`);
  }
  const videosData = (await videosRes.json()) as { items: VideosListItem[] };
  const durationById = new Map(videosData.items.map((v) => [v.id, parseIso8601Duration(v.contentDetails.duration)]));

  return items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
    durationSeconds: durationById.get(item.id.videoId) ?? 0,
  }));
}
