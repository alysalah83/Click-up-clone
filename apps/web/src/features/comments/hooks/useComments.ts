import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { ActionErrorResponse, ActionResponse } from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import {
  createCommentAction,
  deleteCommentAction,
  toggleReactionAction,
} from "../actions/comments.actions";
import type { CommentDto } from "../types";

const commentsKey = (taskId: string) => ["comments", taskId] as const;

/** Comments of a task, refetched every 30s while the panel is open. */
export function useComments(taskId: string) {
  const { data: comments, isPending, error } = useQuery({
    queryKey: commentsKey(taskId),
    queryFn: () => axiosClient.get<CommentDto[]>(`/api/tasks/${taskId}/comments`),
    refetchInterval: 30 * 1000,
  });
  return { comments, isPending, error };
}

function useCommentMutation<V>(taskId: string, write: (v: V) => Promise<ActionResponse>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: V) => {
      const response = await write(variables);
      if (response.status === "error") throw response;
      return response;
    },
    onError(error: ActionErrorResponse) {
      window.toast?.error(formatErrorForToast(error.error), 7);
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: commentsKey(taskId) });
    },
  });
}

export function useCreateComment(taskId: string) {
  return useCommentMutation(taskId, ({ body, parentId }: { body: string; parentId?: string }) =>
    createCommentAction(taskId, body, parentId),
  );
}

export function useDeleteComment(taskId: string) {
  return useCommentMutation(taskId, (commentId: string) => deleteCommentAction(commentId));
}

export function useToggleReaction(taskId: string) {
  return useCommentMutation(taskId, ({ commentId, emoji }: { commentId: string; emoji: string }) =>
    toggleReactionAction(commentId, emoji),
  );
}
