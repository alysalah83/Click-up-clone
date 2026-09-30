import AutomationsDialog from "@/features/automation/components/AutomationsDialog";
import AddStatus from "@/features/status/components/AddStatus";
import SortBtnWithMenu from "@/features/task/components/Sort/SortBtnWithMenu";
import { TASK_VIEWS } from "@/features/task/constants/tasks.const";
import { Button } from "@/shared/ui/Button";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import { usePathname } from "next/navigation";

function HeaderFeatures() {
  const pathname = usePathname();
  const isInTaskView = TASK_VIEWS.some((taskView) =>
    pathname.endsWith(`/${taskView}`),
  );
  const isInCalendarView = pathname.endsWith("/calendar");
  const isInTableView = pathname.includes("table");

  return (
    isInTaskView && (
      <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-4">
        <>
          {!isInCalendarView && (
            <Menu>
              <MenuTrigger>
                <Button
                  type="colored"
                  size="smallWithMidPadding"
                  rounded="large"
                  ariaLabel="add status button"
                >
                  Add Status
                </Button>
              </MenuTrigger>
              <MenuContent>
                <AddStatus />
              </MenuContent>
            </Menu>
          )}
          <SortBtnWithMenu withSortStatusField={isInTableView} />{" "}
          <AutomationsDialog />
        </>
      </div>
    )
  );
}

export default HeaderFeatures;
