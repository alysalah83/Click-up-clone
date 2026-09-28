"use client";

import { OptionItem } from "@/shared/types/types";
import OptionsMenuItem from "./OptionsMenuItem";

function OptionsMenu({ options }: { options: OptionItem[] }) {
  return (
    <menu className="min-w-3xs list-none p-2">
      {options.map((option) => (
        <OptionsMenuItem option={option} key={option.label} />
      ))}
    </menu>
  );
}

export default OptionsMenu;
