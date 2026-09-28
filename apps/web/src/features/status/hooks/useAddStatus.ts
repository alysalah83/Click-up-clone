"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateStatusInputs, Status } from "../types";
import { createStatus } from "../actions/create-status.action";
import { STATUS_HIGHEST_ORDER } from "../consts";
import { useParams } from "next/navigation";
import { ActionErrorResponse } from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";

export function useAddStatus() {
  const { listId } = useParams<{ listId: string }>();
  const queryClient = useQueryClient();
  const queryKey = ["statuses", listId];

  const {
    mutate: addStatus,
    error,
    status,
  } = useMutation({
    mutationFn: async (createStatusInputs: CreateStatusInputs) => {
      const response = await createStatus(createStatusInputs);
      if (response.status === "error") throw response;
      return response;
    },

    async onMutate(createStatusInputs: CreateStatusInputs) {
      await queryClient.cancelQueries({
        queryKey,
      });
      const previousStatuses =
        queryClient.getQueryData<Status[]>(queryKey) ?? [];
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      queryClient.setQueryData(queryKey, (oldStatuses: Status[] = []) => {
        const oldHighestActiveOrder = oldStatuses.reduce(
          (acc, curStatus) =>
            curStatus.order === STATUS_HIGHEST_ORDER
              ? acc
              : Math.max(acc, curStatus.order),
          0,
        );
        const newStatus = {
          ...createStatusInputs,
          id: tempId,
          order: oldHighestActiveOrder + 100,
        };
        return [...oldStatuses, newStatus].toSorted(
          (a, b) => a.order - b.order,
        );
      });
      return { previousStatuses, tempId };
    },

    onError(error: ActionErrorResponse, _, context) {
      if (context?.previousStatuses)
        queryClient.setQueryData(queryKey, context.previousStatuses);
      window.toast?.error(formatErrorForToast(error.error), 7);
    },

    onSuccess(data, _, context) {
      if (data.status === "success" && "payload" in data) {
        const { newStatus } = data.payload;
        queryClient.setQueryData(queryKey, (oldStatuses: Status[] = []) =>
          oldStatuses.map((status) =>
            status.id === context.tempId ? newStatus : status,
          ),
        );
        window.toast?.success(`Status (${newStatus.name}) has been added`);
      }
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  return { addStatus, error, status };
}
