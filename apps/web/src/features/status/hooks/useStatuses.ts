"use client";

import { useQuery } from "@tanstack/react-query";
import { getStatusesClient } from "../api/status.client";
import { useParams } from "next/navigation";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ApiError } from "@/shared/lib/errors";
import { Status } from "../types";
import { STATUS_REVALIDATION_TIME } from "../consts";

export function useStatuses() {
  const { listId } = useParams<{ listId: string }>();
  const {
    data: statuses,
    isPending,
    error,
  } = useQuery<Status[], ApiError>({
    queryFn: () => getStatusesClient(listId),
    queryKey: ["statuses", listId],
    enabled: !!listId,
    staleTime: STATUS_REVALIDATION_TIME,
  });

  if (error) window.toast?.error(formatErrorForToast(formatActionError(error)));

  return { statuses, isPending };
}
