/** Mirrors MAX_ATTACHMENT_BYTES in @clickup/shared: Vercel caps function request bodies at ~4.5 MB. */
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

/** "1.2 MB", "340 KB", "12 B" (same as `formatFileSize` in @clickup/shared). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

export type FileKind = "image" | "pdf" | "doc" | "sheet" | "archive" | "video" | "audio" | "code" | "other";

const EXTENSIONS: Record<string, FileKind> = {
  pdf: "pdf",
  doc: "doc", docx: "doc", txt: "doc", md: "doc", rtf: "doc", odt: "doc", pages: "doc",
  xls: "sheet", xlsx: "sheet", csv: "sheet", ods: "sheet", numbers: "sheet",
  zip: "archive", rar: "archive", "7z": "archive", gz: "archive", tar: "archive",
  mp4: "video", mov: "video", webm: "video", avi: "video",
  mp3: "audio", wav: "audio", ogg: "audio", m4a: "audio",
  js: "code", ts: "code", tsx: "code", json: "code", html: "code", css: "code", py: "code", sql: "code",
};

export const extensionOf = (fileName: string) => {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
};

/** Which icon/preview a file gets, from its content type, then its extension. */
export function fileKind(contentType: string, fileName: string): FileKind {
  if (/^image\/(png|jpe?g|gif|webp|avif|svg\+xml|bmp)$/.test(contentType)) return "image";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return EXTENSIONS[extensionOf(fileName)] ?? "other";
}

/** Vercel Blob serves `?download=1` with Content-Disposition: attachment; other URLs rely on `<a download>`. */
export function downloadUrl(url: string) {
  return /\.blob\.vercel-storage\.com\//.test(url) ? `${url}${url.includes("?") ? "&" : "?"}download=1` : url;
}

/** Splits picked/dropped files into ones small enough to upload and the oversized rest. */
export function partitionBySize<T extends { size: number }>(files: T[], max = MAX_ATTACHMENT_BYTES) {
  return { ok: files.filter((f) => f.size > 0 && f.size <= max), tooBig: files.filter((f) => f.size > max) };
}
