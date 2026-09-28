"use client";

import { useListMenuActions } from "../hooks/useListMenuActions";
import { getOptionItems } from "@/shared/lib/utils/getOptionItems";
import { OPTIONS_UI_MENU } from "../consts";
import OptionsMenu from "@/shared/components/OptionsMenu/OptionsMenu";

function OptionsContent() {
  const actions = useListMenuActions();
  const options = getOptionItems(actions, OPTIONS_UI_MENU);
  return <OptionsMenu options={options} />;
}

export default OptionsContent;
