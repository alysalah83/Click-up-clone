"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    <TooltipProvider delayDuration={500}>
      <Tooltip>{children}</Tooltip>
    </TooltipProvider>
  );
}

function ToolTipTrigger({ children }: { children: ReactNode }) {
  return (
    <TooltipTrigger asChild>
      <span className="inline-block">{children}</span>
    </TooltipTrigger>
  );
}

function ToolTipMessage({
  children,
  messagePosition = "top",
  withArrow = true,
}: MessageProps) {
  return (
    <TooltipContent
      side={messagePosition}
      sideOffset={TOOLTIP_MARGIN}
      className={cn(
        "bg-tooltip text-tooltip-foreground z-[99999] max-w-xs overflow-hidden text-ellipsis whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg",
        "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0",
      )}
      hideArrow={!withArrow}
    >
      {children}
    </TooltipContent>
  );
}

export { ToolTip, ToolTipTrigger, ToolTipMessage };
