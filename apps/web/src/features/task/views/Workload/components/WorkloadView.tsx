"use client";

import { memo, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { addDays, format, isSameMonth, isWeekend, startOfDay } from "date-fns";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AlertTriangle, ChevronLeft, ChevronRight, Info, UserX } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/shared/lib/utils/cn";
import { TimelineSkeleton } from "@/features/list/components/ListViewSkeleton";
import { useCurrentList } from "@/features/sprint/components/SprintBar";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { useListMembers } from "@/features/members/hooks/useMembers";
import { useSetAssignees } from "@/features/members/hooks/useSetAssignees";
import { useSetCapacity } from "@/features/members/hooks/useSetCapacity";
import { displayName } from "@/features/members/lib/avatar";
import type { Assignee } from "@/features/members/types";
import { useOpenTask } from "@/features/taskDetail/hooks/useTaskParam";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import type { Task } from "@/features/task/types";
import { moveAssignee } from "@/features/task/views/Board/lib/swimlanes";
import { ViewToolbar } from "@/features/viewConfig/components/ViewToolbar";
import { useViewTasks } from "@/features/viewConfig/hooks/useViewTasks";
import { UNASSIGNED } from "@/features/viewConfig/lib/applyViewConfig";
import { useViewConfigStore } from "@/features/viewConfig/store";
import { CapacityPopover } from "./CapacityPopover";
import {
  DEFAULT_CAPACITY,
  buildPeriods,
  buildWorkload,
  cellCapacity,
  loadLevel,
  resolveWorkloadDrop,
  shiftTaskDates,
  stepAnchor,
  type LoadLevel,
  type Period,
  type WorkloadCell,
  type WorkloadMeasure,
  type WorkloadMode,
  type WorkloadPoint,
} from "../workload.lib";

/** Chips shown in a cell before "+N more". */
const MAX_CHIPS = 3;

interface Person {
  key: string;
  user: Assignee;
  name: string;
  capacityTasks: number | null;
  capacityPoints: number | null;
}

const LEVEL_BAR: Record<LoadLevel, string> = {
  empty: "bg-transparent",
  under: "bg-emerald-500",
  near: "bg-amber-500",
  over: "bg-red-500",
};
const LEVEL_CELL: Record<LoadLevel, string> = {
  empty: "",
  under: "",
  near: "bg-amber-50/70 dark:bg-amber-950/20",
  over: "bg-red-50 dark:bg-red-950/30",
};
const LEVEL_TEXT: Record<LoadLevel, string> = {
  empty: "text-neutral-400",
  under: "text-emerald-700 dark:text-emerald-400",
  near: "text-amber-700 dark:text-amber-400",
  over: "text-red-600 dark:text-red-400",
};

const segBtn = (active: boolean) =>
  cn(
    "h-7 cursor-pointer px-2.5 text-xs font-medium transition",
    active
      ? "bg-violet-600 text-white"
      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
  );
const navBtn =
  "inline-flex h-7 cursor-pointer items-center justify-center rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800";

const dotOf = (task: Task) =>
  task.status?.type === "done"
    ? "bg-emerald-500"
    : task.status?.type === "active"
      ? "bg-violet-500"
      : "bg-neutral-400";

function ChipBody({ task, measure }: { task: Task; measure: WorkloadMeasure }) {
  const done = task.status?.type === "done";
  return (
    <>
      <span className={cn("size-1.5 shrink-0 rounded-full", dotOf(task))} />
      <span className={cn("min-w-0 flex-1 truncate", done && "line-through")}>{task.name}</span>
      {measure === "points" && task.points != null && (
        <span className="shrink-0 rounded bg-neutral-100 px-1 text-[10px] tabular-nums text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
          {task.points}
        </span>
      )}
    </>
  );
}

const chipClass =
  "flex w-full items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-1.5 py-1 text-left text-[11px] font-medium text-neutral-800 shadow-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";

function Chip({
  task,
  rowKey,
  periodIndex,
  measure,
  onOpen,
}: {
  task: Task;
  rowKey: string;
  periodIndex: number;
  measure: WorkloadMeasure;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${task.id}::${rowKey}::${periodIndex}`,
    data: { taskId: task.id, rowKey, periodIndex },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task.id)}
      title={task.name}
      className={cn(
        chipClass,
        "cursor-grab hover:border-violet-400",
        task.status?.type === "done" && "opacity-60",
        isDragging && "opacity-30",
      )}
    >
      <ChipBody task={task} measure={measure} />
    </button>
  );
}

const Cell = memo(function Cell({
  rowKey,
  index,
  cell,
  capacity,
  measure,
  shaded,
  onOpen,
}: {
  rowKey: string;
  index: number;
  cell: WorkloadCell;
  /** Null on the Unassigned row (no capacity). */
  capacity: number | null;
  measure: WorkloadMeasure;
  shaded: boolean;
  onOpen: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { isOver, setNodeRef } = useDroppable({
    id: `wl:${rowKey}:${index}`,
    data: { rowKey, periodIndex: index } satisfies WorkloadPoint,
  });
  const level = capacity === null ? "empty" : loadLevel(cell.load, capacity);
  const shown = expanded ? cell.tasks : cell.tasks.slice(0, MAX_CHIPS);
  const hidden = cell.tasks.length - shown.length;
  const pct = capacity ? Math.min(cell.load / capacity, 1) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-20 flex-col gap-1 border-b border-l border-neutral-200 p-1.5 dark:border-neutral-800",
        shaded && level !== "over" && level !== "near" && "bg-neutral-50 dark:bg-neutral-800/30",
        LEVEL_CELL[level],
        isOver && "bg-violet-50 ring-2 ring-violet-400 ring-inset dark:bg-violet-950/30",
      )}
    >
      {(cell.load > 0 || capacity === null) && cell.tasks.length > 0 && (
        <div className="flex items-center gap-1.5">
          {capacity !== null && (
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div className={cn("h-full rounded-full", LEVEL_BAR[level])} style={{ width: `${pct}%` }} />
            </div>
          )}
          <span
            className={cn(
              "ml-auto shrink-0 text-[11px] font-semibold tabular-nums",
              capacity === null ? "text-neutral-500" : LEVEL_TEXT[level],
            )}
            title={capacity === null ? undefined : `${cell.load} of ${capacity} ${measure}`}
          >
            {capacity === null ? cell.load : `${cell.load} / ${capacity}`}
          </span>
        </div>
      )}
      {shown.map((task) => (
        <Chip key={task.id} task={task} rowKey={rowKey} periodIndex={index} measure={measure} onOpen={onOpen} />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="cursor-pointer self-start rounded px-1 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          +{hidden} more
        </button>
      )}
      {expanded && cell.tasks.length > MAX_CHIPS && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="cursor-pointer self-start rounded px-1 text-[11px] text-neutral-500 hover:underline"
        >
          Show less
        </button>
      )}
    </div>
  );
});

function rangeLabel(periods: Period[]) {
  const first = periods[0]!.start;
  const last = addDays(periods.at(-1)!.end, -1);
  return isSameMonth(first, last)
    ? `${format(first, "MMM d")} – ${format(last, "d, yyyy")}`
    : `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;
}

function WorkloadView() {
  const { listId } = useParams<{ listId: string }>();
  const { tasks, isPending } = useViewTasks();
  const { members } = useListMembers(listId);
  const list = useCurrentList();
  const assigneeFilter = useViewConfigStore((s) => s.filters.assignees);
  const { setAssignees } = useSetAssignees();
  const { updateTask } = useUpdateTask();
  const { setCapacity } = useSetCapacity(listId, list?.workspaceId);
  const openTask = useOpenTask();

  const [mode, setMode] = useState<WorkloadMode>("day");
  const [measure, setMeasure] = useState<WorkloadMeasure>("tasks");
  const [anchor, setAnchor] = useState(() => new Date());
  const [active, setActive] = useState<Task | null>(null);
  const today = startOfDay(new Date());

  const periods = useMemo(() => buildPeriods(anchor, mode), [anchor, mode]);

  // Rows: the space's members (narrowed by the Assignee filter), then "Unassigned".
  const people = useMemo<Person[]>(() => {
    const list = (members ?? []).map((m) => {
      const user: Assignee = { id: m.userId, name: m.name, email: m.email, avatarColor: m.avatarColor };
      return {
        key: m.userId,
        user,
        name: displayName(user),
        capacityTasks: m.capacityTasks ?? null,
        capacityPoints: m.capacityPoints ?? null,
      };
    });
    return list
      .filter((p) => !assigneeFilter.length || assigneeFilter.includes(p.key))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, assigneeFilter]);
  const showUnassigned = !assigneeFilter.length || assigneeFilter.includes(UNASSIGNED);
  const rowKeys = useMemo(
    () => [...people.map((p) => p.key), ...(showUnassigned ? [UNASSIGNED] : [])],
    [people, showUnassigned],
  );
  const grid = useMemo(
    () => buildWorkload(tasks ?? [], rowKeys, periods, measure),
    [tasks, rowKeys, periods, measure],
  );
  const undated = (tasks ?? []).filter((t) => !t.endDate).length;

  const perDay = (p: Person) =>
    (measure === "tasks" ? p.capacityTasks : p.capacityPoints) ?? DEFAULT_CAPACITY[measure];
  const unit = measure === "tasks" ? "tasks" : "pts";

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Long-press on touch screens, so a swipe still scrolls the grid sideways.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );

  const handleDragStart = (e: DragStartEvent) => {
    const id = e.active.data.current?.taskId as string | undefined;
    setActive(tasks?.find((t) => t.id === id) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const from = e.active.data.current as (WorkloadPoint & { taskId: string }) | undefined;
    if (!from) return;
    const move = resolveWorkloadDrop(from, e.over?.data.current as WorkloadPoint | undefined, periods);
    const task = tasks?.find((t) => t.id === from.taskId);
    if (!move || !task) return;

    const messages: string[] = [];
    if (move.reassign) {
      const target = people.find((p) => p.key === move.reassign!.to) ?? null;
      setAssignees({
        taskId: task.id,
        assignees: moveAssignee(task.assignees ?? [], move.reassign.from, target?.user ?? null),
      });
      messages.push(target ? `Reassigned to ${target.name}` : "Moved to Unassigned");
    }
    if (move.dayDelta) {
      const { startDate, endDate } = shiftTaskDates(task, move.dayDelta);
      updateTask({
        taskId: task.id,
        updateTaskInput: { endDate, ...(startDate && { startDate }) },
      });
      if (endDate) messages.push(`due ${format(endDate, "EEE, MMM d")}`);
    }
    const text = messages.join(", ");
    window.toast?.success(text.charAt(0).toUpperCase() + text.slice(1), 3);
  };

  if (isPending) return <TimelineSkeleton />;

  const cols = periods.length;
  const colMin = mode === "day" ? 132 : 148;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <ViewToolbar />

      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous" className={navBtn} onClick={() => setAnchor((a) => stepAnchor(a, mode, -1))}>
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" className={navBtn} onClick={() => setAnchor(new Date())}>
            Today
          </button>
          <button type="button" aria-label="Next" className={navBtn} onClick={() => setAnchor((a) => stepAnchor(a, mode, 1))}>
            <ChevronRight className="size-4" />
          </button>
        </div>
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{rangeLabel(periods)}</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Columns" className="flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <button type="button" aria-pressed={mode === "day"} className={segBtn(mode === "day")} onClick={() => setMode("day")}>
              Day
            </button>
            <button type="button" aria-pressed={mode === "week"} className={segBtn(mode === "week")} onClick={() => setMode("week")}>
              Week
            </button>
          </div>
          <div role="group" aria-label="Measure" className="flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <button type="button" aria-pressed={measure === "tasks"} className={segBtn(measure === "tasks")} onClick={() => setMeasure("tasks")}>
              Tasks
            </button>
            <button type="button" aria-pressed={measure === "points"} className={segBtn(measure === "points")} onClick={() => setMeasure("points")}>
              Points
            </button>
          </div>
          <Popover>
            <PopoverTrigger aria-label="How workload is counted" className={cn(navBtn, "px-1.5")}>
              <Info className="size-4" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              <p className="mb-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">How workload is counted</p>
              <p>
                A task counts once, on its <b>due date</b>, for each of its assignees ({measure === "tasks" ? "1 per task" : "its sprint points"}).
                Done tasks are shown but don&apos;t count; tasks without a due date are left out.
              </p>
              <p className="mt-1.5">
                Capacity is per person per day (default {DEFAULT_CAPACITY.tasks} tasks or {DEFAULT_CAPACITY.points} points; a week is 5 working days).
                Click a person&apos;s capacity to change it.
              </p>
              <p className="mt-1.5">
                <span className="font-semibold text-red-600">Red</span>: over capacity,{" "}
                <span className="font-semibold text-amber-600">amber</span>: 80% or more,{" "}
                <span className="font-semibold text-emerald-600">green</span>: below.
              </p>
              <p className="mt-1.5">Drag a task to another person to reassign it, or to another column to move its dates.</p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActive(null)}>
        <div className="min-h-0 flex-1 overflow-auto border-t border-neutral-200 dark:border-neutral-800">
          <div
            className="grid [--label-w:150px] sm:[--label-w:220px]"
            style={{
              gridTemplateColumns: `var(--label-w) repeat(${cols}, minmax(${colMin}px, 1fr))`,
              minWidth: `calc(var(--label-w) + ${cols * colMin}px)`,
            }}
          >
            {/* Header row */}
            <div className="sticky top-0 left-0 z-30 flex items-end border-b border-neutral-200 bg-white px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
              Team
            </div>
            {periods.map((p, i) => {
              const isCurrent = today >= p.start && today < p.end;
              return (
                <div
                  key={i}
                  className={cn(
                    "sticky top-0 z-20 flex h-12 flex-col items-center justify-center border-b border-l border-neutral-200 bg-white text-xs dark:border-neutral-800 dark:bg-neutral-900",
                    isCurrent ? "text-violet-600 dark:text-violet-300" : "text-neutral-500",
                  )}
                >
                  {mode === "day" ? (
                    <>
                      <span className="font-medium uppercase">{format(p.start, "EEE")}</span>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex size-6 items-center justify-center rounded-full text-sm font-semibold",
                          isCurrent ? "bg-violet-600 text-white" : "text-neutral-800 dark:text-neutral-100",
                        )}
                      >
                        {format(p.start, "d")}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium uppercase">{isCurrent ? "This week" : `Week ${format(p.start, "w")}`}</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                        {format(p.start, "MMM d")} – {format(addDays(p.end, -1), isSameMonth(p.start, addDays(p.end, -1)) ? "d" : "MMM d")}
                      </span>
                    </>
                  )}
                </div>
              );
            })}

            {/* People */}
            {people.map((person) => {
              const row = grid.get(person.key)!;
              const capacity = cellCapacity(perDay(person), mode);
              const overloaded = row.cells.some((c) => c.load > capacity);
              return (
                <Row key={person.key}>
                  <div className="sticky left-0 z-10 flex min-w-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
                    <UserAvatar user={person.user} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100" title={person.name}>
                        {person.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
                            overloaded ? "text-red-600 dark:text-red-400" : "text-neutral-500",
                          )}
                          title={overloaded ? "Over capacity on at least one day" : undefined}
                        >
                          {overloaded && <AlertTriangle className="size-3" aria-label="Overloaded" />}
                          {row.total} {unit}
                        </span>
                        <CapacityPopover
                          name={person.name}
                          tasks={person.capacityTasks}
                          points={person.capacityPoints}
                          label={`${perDay(person)}/day`}
                          onSave={(c) => setCapacity({ userId: person.key, ...c })}
                        />
                      </div>
                    </div>
                  </div>
                  {row.cells.map((cell, i) => (
                    <Cell
                      key={i}
                      rowKey={person.key}
                      index={i}
                      cell={cell}
                      capacity={capacity}
                      measure={measure}
                      shaded={mode === "day" && isWeekend(periods[i]!.start)}
                      onOpen={openTask}
                    />
                  ))}
                </Row>
              );
            })}

            {showUnassigned && (
              <Row>
                <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300">
                    <UserX className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">Unassigned</p>
                    <span className="text-[11px] font-semibold tabular-nums text-neutral-500">
                      {grid.get(UNASSIGNED)!.total} {unit}
                    </span>
                  </div>
                </div>
                {grid.get(UNASSIGNED)!.cells.map((cell, i) => (
                  <Cell
                    key={i}
                    rowKey={UNASSIGNED}
                    index={i}
                    cell={cell}
                    capacity={null}
                    measure={measure}
                    shaded={mode === "day" && isWeekend(periods[i]!.start)}
                    onOpen={openTask}
                  />
                ))}
              </Row>
            )}
          </div>
          {undated > 0 && (
            <p className="px-4 py-3 text-xs text-neutral-500">
              {undated} task{undated === 1 ? "" : "s"} without a due date {undated === 1 ? "is" : "are"} not shown.
            </p>
          )}
        </div>
        <DragOverlay dropAnimation={null}>
          {active && (
            <div className={cn(chipClass, "w-40 cursor-grabbing shadow-lg ring-2 ring-violet-400")}>
              <ChipBody task={active} measure={measure} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

/** A grid row: its cells sit directly in the parent grid. */
function Row({ children }: { children: React.ReactNode }) {
  return <div className="contents">{children}</div>;
}

export default WorkloadView;
