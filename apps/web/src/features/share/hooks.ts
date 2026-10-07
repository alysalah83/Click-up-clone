import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosClient } from "@/shared/lib/axios/client";
import type { ShareLinkDto, ShareLinkState, ShareTarget } from "./types";

const shareKey = ({ resourceType, resourceId }: ShareTarget) => ["share-link", resourceType, resourceId] as const;
const apiPath = ({ resourceType, resourceId }: ShareTarget) => `/api/share-links/${resourceType}/${resourceId}`;

/** The resource's public link (null until it is first shared) and whether I may change it. */
export function useShareLink(target: ShareTarget, enabled = true) {
  return useQuery({
    queryKey: shareKey(target),
    queryFn: () => axiosClient.get<ShareLinkState>(apiPath(target)),
    enabled,
    staleTime: 15 * 1000,
  });
}

function useStoreLink(target: ShareTarget) {
  const queryClient = useQueryClient();
  return ({ link }: { link: ShareLinkDto }) =>
    queryClient.setQueryData<ShareLinkState>(shareKey(target), (prev) => ({ canManage: prev?.canManage ?? true, link }));
}

export function useSetShareActive(target: ShareTarget) {
  const store = useStoreLink(target);
  return useMutation({
    mutationFn: (isActive: boolean) => axiosClient.put<{ link: ShareLinkDto }>(apiPath(target), { isActive }),
    onSuccess: store,
    onError: (error: Error) => toast.error(error.message || "Could not update the share link"),
  });
}

export function useResetShareLink(target: ShareTarget) {
  const store = useStoreLink(target);
  return useMutation({
    mutationFn: () => axiosClient.post<{ link: ShareLinkDto }>(`${apiPath(target)}/reset`),
    onSuccess: (data) => {
      store(data);
      toast.success("New link created. The old one no longer works.");
    },
    onError: (error: Error) => toast.error(error.message || "Could not reset the link"),
  });
}
