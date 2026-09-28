import { ICONS_MAP } from "@/shared/icons/icons-map";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import {
  ToolTip,
  ToolTipMessage,
  ToolTipTrigger,
} from "@/shared/ui/ToolTip/ToolTipCompound ";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function ThemeButton() {
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted)
    return <SkeletonLoader rounded="rounded-full" width="w-6" height="h-6" />;

  return (
    <ToolTip>
      <ToolTipTrigger>
        <button
          type="button"
          aria-label="toggle theme button"
          className="cursor-pointer p-1"
        >
          {resolvedTheme === "light" ? (
            <ICONS_MAP.sun
              className="size-6 fill-amber-500 transition duration-200 hover:fill-amber-600"
              onClick={() => setTheme("dark")}
            />
          ) : (
            <ICONS_MAP.moon
              className="size-6 fill-neutral-500 transition duration-200 hover:fill-neutral-600"
              onClick={() => setTheme("light")}
            />
          )}
        </button>
      </ToolTipTrigger>
      <ToolTipMessage messagePosition="left">Theme button</ToolTipMessage>
    </ToolTip>
  );
}

export default ThemeButton;
