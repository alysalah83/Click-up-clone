import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { Doc, DocPatch, DocSummary } from "../types";

export const DOCS_KEY = ["docs", "list"] as const;
const docKey = (id: string) => ["docs", "detail", id] as const;

/** Every doc in my spaces (no content). The sidebar tree and the docs home share this one query. */
export function useDocs() {
  return useQuery({
    queryKey: DOCS_KEY,
    queryFn: () => axiosClient.get<DocSummary[]>("/api/docs"),
    staleTime: 30_000,
  });
}

export function useDoc(id: string) {
  return useQuery({
    queryKey: docKey(id),
    queryFn: () => axiosClient.get<Doc>(`/api/docs/${id}`),
    retry: false,
    // The editor owns the content once mounted; refetches must not replace what is being typed.
    staleTime: Infinity,
  });
}

export function useWorkspaceNames() {
  return useQuery({
    queryKey: ["docs", "spaces"],
    queryFn: () => axiosClient.get<{ id: string; name: string }[]>("/api/workspaces"),
    staleTime: 60_000,
  });
}

export function useCreateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; parentId?: string | null; title?: string }) =>
      axiosClient.post<Doc>("/api/docs", input),
    onSuccess: (doc) => {
      queryClient.setQueryData(docKey(doc.id), doc);
      queryClient.invalidateQueries({ queryKey: DOCS_KEY });
    },
  });
}

export function useUpdateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: DocPatch }) =>
      axiosClient.patch<Doc>(`/api/docs/${id}`, patch),
    onSuccess: (doc) => {
      queryClient.setQueryData(docKey(doc.id), doc);
      queryClient.setQueryData<DocSummary[]>(DOCS_KEY, (docs) =>
        docs?.map((d) =>
          d.id === doc.id
            ? { ...d, title: doc.title, icon: doc.icon, parentId: doc.parentId, updatedAt: doc.updatedAt }
            : d,
        ),
      );
    },
  });
}

export function useDeleteDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/api/docs/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["docs"] }),
  });
}
