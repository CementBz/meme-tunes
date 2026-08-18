import type { PreviewSearchResult } from "@meme-tunes/shared";

interface DeezerResultItem {
  preview?: string;
  title?: string;
  duration?: number;
  artist?: { name?: string };
  album?: { cover_medium?: string };
}

export async function searchDeezer(query: string): Promise<PreviewSearchResult[]> {
  const url = new URL("https://api.deezer.com/search");
  url.searchParams.set("q", query);

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Deezer-Suche fehlgeschlagen (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { data: DeezerResultItem[] };

  return data.data
    .filter((item) => Boolean(item.preview && item.title && item.artist?.name))
    .slice(0, 10)
    .map((item) => ({
      previewUrl: item.preview!,
      title: item.title!,
      artist: item.artist!.name!,
      artworkUrl: item.album?.cover_medium ?? "",
      durationSeconds: item.duration ?? 30,
    }));
}
