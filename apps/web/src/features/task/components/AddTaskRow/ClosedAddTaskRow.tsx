import { ICONS_MAP } from "@/shared/icons/icons-map";
import { memo } from "react";
import { slotPadding as tableSlotPadding } from "../../views/Table/table.styles";
import { StyleFor } from "./type";

function ClosedAddTaskRow({ styleFor }: { styleFor: StyleFor }) {
  const Icon = ICONS_MAP.plus;

  return (
    <div
      className={`flex items-center ${styleFor === "table" ? `${tableSlotPadding} col-span-1 justify-center` : "px-2 py-1.5"}`}
    >
      <Icon className={`size-3.5 text-neutral-600`} />
    </div>
  );
}

export default memo(ClosedAddTaskRow);
