"use client";

import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import StatusesUpdater from "../../../status/components/StatusesUpdater";
import DatesUpdater from "./DatesUpdater";
import PrioritiesUpdater from "./PrioritiesUpdater";
import { useCheckTask } from "../../context/CheckTaskProvider";
import { useDeleteTasks } from "../../hooks/useDeleteTasks";

function ActionsRow() {
  const [isClient, setIsClient] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIsClient(true), []);

  const { checkedTasksIdSet, handleClearAllChecked } = useCheckTask();
  const { deleteTasks } = useDeleteTasks();

  const handleDelete = useCallback(() => {
    deleteTasks(checkedTasksIdSet);
    handleClearAllChecked();
  }, [checkedTasksIdSet, handleClearAllChecked, deleteTasks]);

  const checkedTaskCount = checkedTasksIdSet.size;
  const isAnyTaskChecked = checkedTaskCount > 0;
  const CloseIcon = ICONS_MAP.close;

  return (
    isClient &&
    createPortal(
      <div
        className={`dark:bg-neutral-750 bg-neutral-300 ${isAnyTaskChecked ? "visible -translate-y-1/2 opacity-100" : "pointer-events-none invisible opacity-0"} absolute bottom-[5%] left-1/2 z-40 flex min-w-2xs -translate-x-1/2 items-center justify-between rounded-lg px-4 py-2 transition duration-200 lg:w-2xl`}
      >
        <div
          onClick={handleClearAllChecked}
          className="flex cursor-pointer items-center rounded-md border border-neutral-200 bg-neutral-50/40 px-2 py-1 text-sm font-medium text-neutral-900 transition duration-300 hover:bg-neutral-300 active:bg-neutral-300 dark:border-neutral-600 dark:bg-neutral-900/10 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:active:bg-neutral-700"
        >
          <span className="tabular-nums">{checkedTaskCount}</span>
          <span className="ml-1"> Task selected</span>
          <CloseIcon className="ml-2 size-4 fill-neutral-900 text-neutral-900 dark:fill-neutral-100 dark:text-neutral-100" />
        </div>
        <div className="flex items-center">
          <div>
            <Menu>
              <MenuTrigger>
                <ButtonIcon
                  icon="bullEye"
                  label="Status"
                  size={4}
                  ariaLabel="update status button"
                />
              </MenuTrigger>
              <MenuContent>
                <StatusesUpdater tasksId={checkedTasksIdSet} />
              </MenuContent>
            </Menu>
          </div>
          <div>
            <Menu>
              <MenuTrigger>
                <ButtonIcon
                  icon="date"
                  label="Dates"
                  size={4}
                  ariaLabel="update due Date button"
                />
              </MenuTrigger>
              <MenuContent>
                <DatesUpdater tasksId={checkedTasksIdSet} />
              </MenuContent>
            </Menu>
          </div>
          <div>
            <Menu>
              <MenuTrigger>
                <ButtonIcon
                  icon="flag"
                  label="Priority"
                  size={4}
                  ariaLabel="update priority button"
                />
              </MenuTrigger>
              <MenuContent>
                <PrioritiesUpdater tasksId={checkedTasksIdSet} />
              </MenuContent>
            </Menu>
          </div>
          <div onClick={handleDelete}>
            <ToolTip>
              <ToolTipTrigger>
                <ButtonIcon
                  icon="trash"
                  iconColor="text-red-400"
                  size={4}
                  ariaLabel="delete selected tasks button"
                />
              </ToolTipTrigger>
              <ToolTipMessage>Delete</ToolTipMessage>
            </ToolTip>
          </div>
        </div>
      </div>,
      document.body,
    )
  );
}

export default ActionsRow;
