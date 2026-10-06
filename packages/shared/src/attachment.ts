/** Vercel functions cap request bodies at ~4.5 MB, and uploads pass through two of them. */
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
export const MAX_ATTACHMENT_NAME_LENGTH = 200;

export interface AttachmentDto {
  id: string;
  taskId: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
  uploader: { id: string; name: string | null; email: string | null; avatarColor: string | null };
}

/** "1.2 MB", "340 KB", "12 B". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

/**
 * A file name safe for a blob pathname segment: no path separators or control characters,
 * whitespace collapsed to "-", at most 100 characters (keeping the extension), never empty.
 */
export function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[\/:*?"<>|#%\u0000-\u001f]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  if (!cleaned || /^\.+$/.test(cleaned)) return "file";
  if (cleaned.length <= 100) return cleaned;
  const dot = cleaned.lastIndexOf(".");
  const ext = dot > 0 && cleaned.length - dot <= 10 ? cleaned.slice(dot) : "";
  return cleaned.slice(0, 100 - ext.length) + ext;
}
