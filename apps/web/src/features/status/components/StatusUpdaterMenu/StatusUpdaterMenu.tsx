import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";

import { Task } from "../../../task/types";
import StatusBadge from "../StatusBadge";
import StatusUpdater from "./StatusUpdater";
import { StylesSizes } from "@/shared/types/index.types";

interface StatusUpdaterMenuProps {
  curStatus: Task["status"];
  statusBadgeSize?: StylesSizes;
}

function StatusUpdaterMenu({
  curStatus,
  statusBadgeSize,
}: StatusUpdaterMenuProps) {
  return (
    <Menu>
      <MenuTrigger containerClasses="w-full">
        <StatusBadge
          status={curStatus.name}
          icon={curStatus.icon}
          bgColor={curStatus.bgColor}
          size={statusBadgeSize}
        />
      </MenuTrigger>
      <MenuContent>
        <StatusUpdater />
      </MenuContent>
    </Menu>
  );
}

export default StatusUpdaterMenu;
