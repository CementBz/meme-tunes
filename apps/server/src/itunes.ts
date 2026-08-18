import type { PreviewSearchResult } from "@meme-tunes/shared";

interface ItunesResultItem {
  previewUrl?: string;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
}

export async function searchItunes(query: string): Promise<PreviewSearchResult[]> {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "10");

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`iTunes-Suche fehlgeschlagen (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { results: ItunesResultItem[] };

  return data.results
    .filter((item): item is Required<Pick<ItunesResultItem, "previewUrl" | "trackName" | "artistName">> & ItunesResultItem =>
      Boolean(item.previewUrl && item.trackName && item.artistName)
    )
    .map((item) => ({
      previewUrl: item.previewUrl!,
      title: item.trackName!,
      artist: item.artistName!,
      artworkUrl: item.artworkUrl100 ?? "",
      durationSeconds: Math.round((item.trackTimeMillis ?? 30000) / 1000),
    }));
}
