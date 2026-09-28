import ErrorMessage from "@/shared/ui/ErrorMessage/ErrorMessage";
import { useModal } from "@/shared/ui/ModalCompound";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { useActionState } from "react";
import Button from "../ui/Button/Button";
import { ActionResponse } from "../types/action.types";

interface DeleteConfirmProps {
  deleteAction: (...args: unknown[]) => Promise<ActionResponse>;
  deletedName: string;
}

function DeleteConfirm({ deleteAction, deletedName }: DeleteConfirmProps) {
  const { closeModal } = useModal();
  const [state, action, isPending] = useActionState(deleteAction, {
    status: "idle",
  });

  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-xs min-w-md flex-col gap-4 p-6 pb-0">
        <div className="w-fit rounded-xl border border-red-600 bg-red-500/30 p-2 dark:border-red-500 dark:bg-red-400/30">
          <ICONS_MAP.trash className="size-6 text-red-500 dark:text-red-400" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-medium">Delete: {deletedName}</h3>
          <p className="text-sm font-medium text-neutral-500">
            All tasks and projects within this Space will be deleted.
            Additionally, automations will become inactive.
          </p>
        </div>
        {state.status === "error" && (
          <ErrorMessage
            error={state.error.message}
            errorObject={state.error.errors}
          />
        )}
      </div>
      <div className="flex w-full gap-2 rounded-br-xl rounded-bl-xl border-t border-neutral-300 bg-neutral-200 px-6 py-5 dark:border-neutral-700 dark:bg-neutral-900">
        <Button
          type="secondary"
          stretch={true}
          disabled={isPending}
          ariaLabel="cancel delete confirmation"
          onClick={closeModal}
        >
          Cancel
        </Button>
        <form action={action} className="w-full">
          <Button
            type="delete"
            stretch={true}
            disabled={isPending}
            pending={isPending}
            ariaLabel="confirm delete"
            pendingSpinnerWidth="medium"
          >
            Delete
          </Button>
        </form>
      </div>
    </section>
  );
}

export default DeleteConfirm;
