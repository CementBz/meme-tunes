import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import multer from "multer";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/wave": ".wav",
  "video/mp4": ".mp4",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${ALLOWED_MIME_TYPES[file.mimetype] ?? ""}`),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error("Nur MP3-, WAV-, MP4-, JPG-, PNG-, GIF- oder WebP-Dateien sind erlaubt."));
    }
  },
});

export function registerUploadRoute(app: Express): void {
  app.use("/uploads", express.static(UPLOADS_DIR));

  app.post("/upload", (req, res) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Upload fehlgeschlagen." });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "Keine Datei erhalten." });
        return;
      }
      res.json({ url: `/uploads/${req.file.filename}` });
    });
  });
}
