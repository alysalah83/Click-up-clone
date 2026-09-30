import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/lib/utils/cn";
import type { TaskTag } from "../types";

/** A colored tag pill: tinted background, colored text, like ClickUp's tags. */
function TagChip({
  tag,
  size = "sm",
  onRemove,
  className,
}: {
  tag: Pick<TaskTag, "name" | "color">;
  size?: "xs" | "sm";
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <Badge
      variant="ghost"
      style={{ backgroundColor: `${tag.color}26`, color: tag.color }}
      className={cn(
        "max-w-40",
        size === "xs" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-xs",
        className,
      )}
    >
      <span className="truncate">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`remove tag ${tag.name}`}
          className="cursor-pointer leading-none opacity-60 hover:opacity-100"
        >
          ×
        </button>
      )}
    </Badge>
  );
}

export default TagChip;
