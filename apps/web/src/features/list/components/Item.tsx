"use client";

import { hoverElementClasses } from "@/shared/constants/styles";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import AddButton from "@/shared/components/AddButton";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";
import {
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
} from "@/shared/ui/DropDown/DropdownCompound";
import { useParams } from "next/navigation";
import { useList } from "./ListContext";
import Link from "next/link";
import { List } from "../types";
import OptionsContent from "./OptionsContent";
import { ICONS_SIZE } from "../consts";
import { useAddTask } from "@/features/task";
import NameField from "./NameField";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { STATUS_LOWEST_ORDER } from "@/features/status/consts";

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
      <Link href={`/home/lists/${list.id}/board`}>
        <ButtonIcon
          icon="list"
          ariaLabel="project list item"
          iconColor={isListIdActive ? "fill-green-600" : undefined}
          size={ICONS_SIZE}
        />
      </Link>
      <NameField />
    </div>
  );
}

function FeatureBtns({ listId }: { listId: string }) {
  const { addTask } = useAddTask(listId);
  const { isRenameOpen } = useList();
  const { statuses } = useStatuses();
  const toDoStatusId = statuses?.find(
    (status) => status.order === STATUS_LOWEST_ORDER,
  )?.id;

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
                <ToolTipMessage>Space settings</ToolTipMessage>
              </ToolTip>
            </MenuTrigger>
            <MenuContent>
              <OptionsContent />
            </MenuContent>
          </Menu>

          <AddButton
            toolTipMessage="Create task"
            ariaLabel="Create task button"
            onClick={() =>
              addTask({
                listId,
                name: "Untitled",
                statusId: toDoStatusId!,
              })
            }
          />
        </div>
      </DropdownMenu>
    )
  );
}

export default Item;
