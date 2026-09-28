import OptionsMenu from "@/shared/components/OptionsMenu/OptionsMenu";
import { getOptionItems } from "@/shared/lib/utils/getOptionItems";
import { OPTIONS_UI_MENU } from "../constants/tasks.const";
import { useTaskMenuActions } from "../hooks/useTaskMenuActions";

function OptionsContent() {
  const actions = useTaskMenuActions();
  const options = getOptionItems(actions, OPTIONS_UI_MENU);

  return <OptionsMenu options={options} />;
}

export default OptionsContent;
