import {
  STATUS_ACTIVE_ORDER,
  STATUS_HIGHEST_ORDER,
  STATUS_LOWEST_ORDER,
} from "@/features/status/consts";
import { useDeleteStatus } from "@/features/status/hooks/useDeleteStatus";
import { Status } from "@/features/status/types";
import AddButton from "@/shared/components/AddButton";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { Button, ButtonIcon } from "@/shared/ui/Button";
import Modal, {
  ModalContent,
  ModalTrigger,
  useModal,
} from "@/shared/ui/ModalCompound";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";

function ColumnFeaturesBtn({
  handleActiveColumn,
  statusId,
  statusName,
  statusOrder,
}: {
  handleActiveColumn: () => void;
  statusId: Status["id"];
  statusName: Status["name"];
  statusOrder: Status["order"];
}) {
  const baseStatusesOrder = [
    STATUS_LOWEST_ORDER,
    STATUS_ACTIVE_ORDER,
    STATUS_HIGHEST_ORDER,
  ];

  return (
    <div className="flex items-center gap-1">
      {!baseStatusesOrder.some(
        (baseStatusOrder) => baseStatusOrder === statusOrder,
      ) && (
        <Modal>
          <ModalTrigger>
            <ToolTip>
              <ToolTipTrigger>
                <ButtonIcon
                  icon="trash"
                  size={4}
                  iconColor="text-red-400"
                  ariaLabel="delete statusButton"
                />
              </ToolTipTrigger>
              <ToolTipMessage>Delete Status</ToolTipMessage>
            </ToolTip>
          </ModalTrigger>
          <ModalContent>
            <DeleteConfirm statusName={statusName} statusId={statusId} />
          </ModalContent>
        </Modal>
      )}

      <AddButton
        onClick={handleActiveColumn}
        toolTipMessage="Add Task"
        ariaLabel="add task button"
      />
    </div>
  );
}

function DeleteConfirm({
  statusName,
  statusId,
}: {
  statusName: Status["name"];
  statusId: Status["id"];
}) {
  const { closeModal } = useModal();
  const { deleteStatus } = useDeleteStatus();

  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-xs min-w-md flex-col gap-4 p-6 pb-0">
        <div className="w-fit rounded-xl border border-red-600 bg-red-500/30 p-2 dark:border-red-500 dark:bg-red-400/30">
          <ICONS_MAP.trash className="size-6 text-red-500 dark:text-red-400" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-medium">Delete: {statusName}</h3>
          <p className="text-sm font-medium text-neutral-500">
            Are you sure you want to delete this status group, all it&apos;s
            tasks will get deleted too.
          </p>
        </div>
      </div>
      <div className="flex w-full gap-2 rounded-br-xl rounded-bl-xl border-t border-neutral-300 bg-neutral-200 px-6 py-5 dark:border-neutral-700 dark:bg-neutral-900">
        <Button
          type="secondary"
          stretch={true}
          ariaLabel="cancel delete confirmation"
          onClick={closeModal}
        >
          Cancel
        </Button>
        <form action={() => deleteStatus(statusId)} className="w-full">
          <Button
            type="delete"
            stretch={true}
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

export default ColumnFeaturesBtn;
