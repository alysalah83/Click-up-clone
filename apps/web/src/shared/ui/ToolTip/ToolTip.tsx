"use client";

import { Tooltip } from "radix-ui";
import type { ReactNode } from "react";
import { TOOLTIP_MARGIN } from "./ToolTip.const";
import { cn } from "@/shared/lib/utils/cn";

interface MessageProps {
  children: ReactNode;
  messagePosition?: "top" | "right" | "bottom" | "left";
  withArrow?: boolean;
}

function ToolTip({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={500}>
      <Tooltip.Root>{children}</Tooltip.Root>
    </Tooltip.Provider>
  );
}

function ToolTipTrigger({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Trigger asChild>
      <span className="inline-block">{children}</span>
    </Tooltip.Trigger>
  );
}

function ToolTipMessage({ children, messagePosition = "top", withArrow = true }: MessageProps) {
  return (
    <Tooltip.Portal>
      <Tooltip.Content
        side={messagePosition}
        sideOffset={TOOLTIP_MARGIN}
        className={cn(
          "bg-tooltip z-[99999] max-w-xs overflow-hidden rounded-lg px-3 py-2 text-xs font-medium tracking-wide text-ellipsis whitespace-nowrap shadow-lg",
          "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        )}
      >
        {children}
        {withArrow && <Tooltip.Arrow className="fill-tooltip" width={12} height={6} />}
      </Tooltip.Content>
    </Tooltip.Portal>
  );
}

export { ToolTip, ToolTipTrigger, ToolTipMessage };
