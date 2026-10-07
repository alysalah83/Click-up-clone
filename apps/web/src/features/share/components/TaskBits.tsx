import { useSyncExternalStore } from "react";
import { Calendar } from "lucide-react";
import { TASK_PRIORITIES_LIST } from "@/features/task/constants/tasks.const";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";
import type { PublicSharePerson, PublicShareTask } from "../types";

/** AvatarStack wants ids: a stable per-task key is enough (people have no public id). */
export const asAvatars = (people: PublicSharePerson[]) =>
  people.map((p, i) => ({ id: `${i}-${p.name}`, name: p.name, avatarColor: p.avatarColor }));

export function PriorityFlag({ priority, withLabel = false }: { priority: PublicShareTask["priority"]; withLabel?: boolean }) {
  if (priority === "none") return withLabel ? <span className="text-muted-foreground">Empty</span> : null;
  const label = priority[0]!.toUpperCase() + priority.slice(1);
  const color = TASK_PRIORITIES_LIST.find((p) => p.label === label)?.colorHex;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" title={`${label} priority`}>
      <ICONS_MAP.flag className="size-3" style={{ color }} aria-hidden />
      {withLabel && label}
    </span>
  );
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });

const noop = () => () => {};
const DAY = 24 * 60 * 60 * 1000;
/** Start of today (UTC) on the client, 0 while server rendering: stable within a day, no hydration mismatch. */
const useToday = () => useSyncExternalStore(noop, () => Math.floor(Date.now() / DAY) * DAY, () => 0);

export function DueDate({ iso, done }: { iso: string | null; done?: boolean }) {
  const today = useToday();
  if (!iso) return null;
  // Due dates are calendar days at 12:00 UTC: overdue once that day is over.
  const overdue = !done && today > 0 && new Date(iso).getTime() < today;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", overdue ? "text-red-500" : "text-muted-foreground")}>
      <Calendar className="size-3" aria-hidden />
      {shortDate(iso)}
    </span>
  );
}
