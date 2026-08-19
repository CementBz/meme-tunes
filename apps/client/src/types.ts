export interface SongSubmission {
  source: "youtube" | "upload" | "itunes" | "deezer";
  videoId: string | null;
  fileUrl: string | null;
  title: string;
  channel: string;
  thumbnailUrl: string;
  startSeconds: number;
  // Filled in by RoundView's onSubmit wrapper right before sending, based on
  // the MemeTextOverlay state — individual pickers just pass null through.
  memeText: string | null;
  memeTextPosition: "top" | "bottom" | null;
}
