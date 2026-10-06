import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosClient } from "@/shared/lib/axios/client";
import { ApiError } from "@/shared/lib/errors";
import { formatFileSize, MAX_ATTACHMENT_BYTES, partitionBySize } from "./lib";
import type { Attachment, PendingUpload } from "./types";

export const attachmentsKey = (taskId: string) => ["attachments", taskId] as const;

export function useAttachments(taskId: string) {
  return useQuery({
    queryKey: attachmentsKey(taskId),
    queryFn: () => axiosClient.get<Attachment[]>(`/api/tasks/${taskId}/attachments`),
    staleTime: 30 * 1000,
  });
}

/** After a change: the task page (activity), the list's cards (paperclip count) and the grid. */
function useRefresh(taskId: string, listId: string) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: attachmentsKey(taskId) });
    queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
  }, [queryClient, taskId, listId]);
}

/**
 * Uploads files one request each (raw body, so the API needs no multipart parser), in parallel,
 * tracking each file's progress. Files over 4 MB are refused up front with a toast.
 */
export function useAttachmentUploads(taskId: string, listId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefresh(taskId, listId);
  const [pending, setPending] = useState<PendingUpload[]>([]);

  const uploadOne = useCallback(
    async (file: File) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setPending((p) => [...p, { id, fileName: file.name, progress: 0 }]);
      try {
        const attachment = await axiosClient.post<Attachment>(`/api/tasks/${taskId}/attachments`, file, {
          headers: {
            "Content-Type": "application/octet-stream",
            "x-file-name": encodeURIComponent(file.name),
            "x-file-type": encodeURIComponent(file.type),
          },
          onUploadProgress: (e) => {
            const progress = e.total ? e.loaded / e.total : 0;
            setPending((p) => p.map((u) => (u.id === id ? { ...u, progress } : u)));
          },
        });
        queryClient.setQueryData<Attachment[]>(attachmentsKey(taskId), (list) =>
          list && !list.some((a) => a.id === attachment.id) ? [...list, attachment] : list,
        );
        return true;
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Upload failed";
        toast.error(`Couldn't upload ${file.name}`, { description: message });
        return false;
      } finally {
        setPending((p) => p.filter((u) => u.id !== id));
      }
    },
    [queryClient, taskId],
  );

  const upload = useCallback(
    async (files: File[]) => {
      const { ok, tooBig } = partitionBySize(files);
      if (tooBig.length > 0)
        toast.error(
          tooBig.length === 1 ? `${tooBig[0]!.name} is too large` : `${tooBig.length} files are too large`,
          { description: `Files can be at most ${formatFileSize(MAX_ATTACHMENT_BYTES)}.` },
        );
      if (ok.length === 0) return;
      const results = await Promise.all(ok.map(uploadOne));
      if (results.some(Boolean)) refresh();
    },
    [uploadOne, refresh],
  );

  return { upload, pending };
}

export function useDeleteAttachment(taskId: string, listId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefresh(taskId, listId);
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/api/attachments/${id}`),
    onMutate: async (id) => {
      const key = attachmentsKey(taskId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Attachment[]>(key);
      queryClient.setQueryData<Attachment[]>(key, (list) => list?.filter((a) => a.id !== id));
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(attachmentsKey(taskId), context.previous);
      toast.error(error instanceof ApiError ? error.message : "Couldn't delete the attachment");
    },
    onSettled: refresh,
  });
}
