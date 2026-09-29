"use client";

import { hoverElementClasses } from "@/shared/constants/styles";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import AddButton from "@/shared/components/AddButton";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTip";
import {
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
} from "@/shared/ui/DropDown/DropdownCompound";
import { useParams } from "next/navigation";
import { useList } from "./ListContext";
import { List } from "../types";
import OptionsContent from "./OptionsContent";
import { ICONS_SIZE } from "../consts";
import NameField from "./NameField";
import { useQueryClient } from "@tanstack/react-query";
import { startTransition } from "react";
import { createTaskInListAction } from "@/features/task/actions";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";

function Item({ list }: { list: List }) {
  const { listId } = useParams<{ listId: string }>();
  const isListIdActive = list.id === listId;
  return (
    <Dropdown toggleOnChildClick={false}>
      <DropdownTrigger>
        <div
          className={`flex items-center justify-between rounded-lg px-2 py-1 transition duration-300 ${isListIdActive ? "bg-neutral-900/10 dark:bg-neutral-200/10" : hoverElementClasses.replace("cursor-pointer", "cursor-default")}`}
        >
          <Heading list={list} isListIdActive={isListIdActive} />

          <FeatureBtns listId={list.id} />
        </div>
      </DropdownTrigger>
    </Dropdown>
  );
}

export function Heading({
  list,
  isListIdActive,
}: {
  list: List;
  isListIdActive: boolean;
}) {
  const { isRenameOpen } = useList();
  return (
    <div
      className={`flex w-full items-center ${isRenameOpen ? "" : "max-w-3/4"} gap-1`}
    >
      <ButtonIcon
        icon="list"
        href={`/home/lists/${list.id}/board`}
        ariaLabel={`open ${list.name}`}
        iconColor={isListIdActive ? "fill-green-600" : undefined}
        size={ICONS_SIZE}
      />
      <NameField />
    </div>
  );
}

function FeatureBtns({ listId }: { listId: string }) {
  const { isRenameOpen } = useList();
  const queryClient = useQueryClient();

  const handleCreateTask = () => {
    startTransition(async () => {
      const response = await createTaskInListAction(listId);
      if (response.status === "error") {
        window.toast?.error(formatErrorForToast(response.error), 7);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
      if (response.status === "success" && "payload" in response) {
        window.toast?.success(
          `Task (${response.payload.newTask.name}) has been added`,
        );
      }
    });
  };

  return (
    !isRenameOpen && (
      <DropdownMenu>
        <div className="flex items-center gap-1">
          <Menu>
            <MenuTrigger>
              <ToolTip>
                <ToolTipTrigger>
                  <ButtonIcon
                    icon="dotsRow"
                    ariaLabel="list show more button"
                    size={ICONS_SIZE}
                  />
                </ToolTipTrigger>
                <ToolTipMessage>List settings</ToolTipMessage>
              </ToolTip>
            </MenuTrigger>
            <MenuContent>
              <OptionsContent />
            </MenuContent>
          </Menu>

          <AddButton
            toolTipMessage="Create task"
            ariaLabel="Create task button"
            onClick={handleCreateTask}
          />
        </div>
      </DropdownMenu>
    )
  );
}

export default Item;
