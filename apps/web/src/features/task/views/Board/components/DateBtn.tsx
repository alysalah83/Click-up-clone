import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";
import ButtonIcon from "@/shared/ui/Button/ButtonIcon";
import { useTask } from "../../../context/TaskProvider";
import { ICON_SIZE } from "../board.const";
import { getFormattedRangeDate } from "@/shared/lib/utils/getFormattedRangeDate";
import DateUpdater from "@/features/task/components/DateUpdater";
import { IconsMap } from "@/shared/icons/icons.type";

function DateBtn({ icon, label }: { icon: IconsMap; label: string }) {
  const {
    task: { endDate, startDate },
  } = useTask();

  const isDateExist = endDate && startDate;

  return (
    <span>
      <Menu>
        <MenuTrigger>
          <ToolTip>
            <ToolTipTrigger>
              {isDateExist ? (
                <ButtonIcon
                  icon="date"
                  label={getFormattedRangeDate({ endDate, startDate })}
                  ariaLabel={`open ${label} menu`}
                  withBg={true}
                  size={ICON_SIZE}
                  padding="small"
                />
              ) : (
                <ButtonIcon
                  icon={icon}
                  withBg={true}
                  ariaLabel={`open ${label} menu`}
                  size={ICON_SIZE}
                />
              )}
            </ToolTipTrigger>
            <ToolTipMessage>{label}</ToolTipMessage>
          </ToolTip>
        </MenuTrigger>
        <MenuContent>
          <DateUpdater />
        </MenuContent>
      </Menu>
    </span>
  );
}

export default DateBtn;
