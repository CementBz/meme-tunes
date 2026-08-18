export interface SongSubmission {
  source: "youtube" | "upload" | "itunes";
  videoId: string | null;
  fileUrl: string | null;
  title: string;
  channel: string;
  thumbnailUrl: string;
  startSeconds: number;
}
