"use client";

import { getOptionItems } from "@/shared/lib/utils/getOptionItems";
import { useWorkspaceMenuActions } from "../hooks/useWorkspaceMenuActions";
import OptionsMenu from "@/shared/components/OptionsMenu/OptionsMenu";
import { OPTIONS_UI_MENU } from "../consts/workspace.consts";

function OptionsContent() {
  const actions = useWorkspaceMenuActions();
  const options = getOptionItems(actions, OPTIONS_UI_MENU);

  return <OptionsMenu options={options} />;
}

export default OptionsContent;
