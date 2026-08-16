export interface SongSubmission {
  source: "youtube" | "upload";
  videoId: string | null;
  fileUrl: string | null;
  title: string;
  channel: string;
  thumbnailUrl: string;
  startSeconds: number;
}
