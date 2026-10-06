/** Mirrors `AttachmentDto` in @clickup/shared. */
export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
  uploader: { id: string; name: string | null; email: string | null; avatarColor: string | null };
}

/** A file being uploaded from this browser. */
export interface PendingUpload {
  id: string;
  fileName: string;
  /** 0..1 */
  progress: number;
}
