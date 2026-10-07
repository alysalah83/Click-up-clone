"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameMonth,
  isWeekend,
  startOfDay,
} from "date-fns";
import useTasks from "@/features/task/hooks/useTasks";
import { TimelineSkeleton } from "@/features/list/components/ListViewSkeleton";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import {
  useDependencies,
  useDependencyMutations,
} from "@/features/task/hooks/useDependencies";
import { useOpenTask } from "@/features/taskDetail/hooks/useTaskParam";
import type { Task } from "@/features/task/types";
import {
  DAY_W,
  HEADER_H,
  ROW_H,
  applyDrag,
  arrowPath,
  barRect,
  dayIndex,
  taskSpan,
  type DragMode,
  type Span,
} from "../timeline.lib";

type Drag = { id: string; mode: DragMode; delta: number };
type Link = { fromId: string; x: number; y: number };

const BAR_H = 24;

function TimelineView() {
  const { listId } = useParams<{ listId: string }>();
  const { tasks, isPending } = useTasks();
  const { dependencies } = useDependencies(listId);
  const { addDependency, removeDependency } = useDependencyMutations(listId);
  const { updateTask } = useUpdateTask();
  const openTask = useOpenTask();

  const today = useMemo(() => startOfDay(new Date()), []);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [link, setLink] = useState<Link | null>(null);
  const gesture = useRef<{ x: number; moved: boolean } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);

  // Rows sorted by start date, computed from saved dates so rows do not jump while dragging.
  const rows = useMemo(() => {
    const list = (tasks ?? []).map((task) => ({
      task,
      span: taskSpan(task, today),
    }));
    return list.sort(
      (a, b) =>
        a.span.start.getTime() - b.span.start.getTime() ||
        a.span.end.getTime() - b.span.end.getTime(),
    );
  }, [tasks, today]);

  const spanOf = (id: string, span: Span) =>
    drag?.id === id ? applyDrag(span, drag.mode, drag.delta) : span;

  // Axis: cover every bar (including a drag in progress) plus some breathing room.
  const origin = useMemo(() => {
    let min = today;
    for (const { span } of rows) if (span.start < min) min = span.start;
    return addDays(min, -5);
  }, [rows, today]);
  const days = useMemo(() => {
    let max = today;
    for (const { span } of rows) if (span.end > max) max = span.end;
    return Math.max(45, differenceInCalendarDays(max, origin) + 15);
  }, [rows, today, origin]);
  const width = days * DAY_W;

  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || !rows.length || !scroller.current) return;
    scrolled.current = true;
    scroller.current.scrollLeft = Math.max(0, dayIndex(today, origin) * DAY_W - 240);
  }, [rows.length, today, origin]);

  const rowIndex = new Map(rows.map((r, i) => [r.task.id, i]));
  const rectOf = (task: Task, span: Span) => {
    const i = rowIndex.get(task.id)!;
    const { x, width: w } = barRect(spanOf(task.id, span), origin);
    return { x, w, cy: i * ROW_H + ROW_H / 2 };
  };
  const byId = new Map(rows.map((r) => [r.task.id, r]));

  // --- Bar drag: move / resize ------------------------------------------------------------
  const startDrag = (
    e: React.PointerEvent<HTMLElement>,
    id: string,
    mode: DragMode,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { x: e.clientX, moved: false };
    setDrag({ id, mode, delta: 0 });
  };
  const moveDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (!drag || !gesture.current) return;
    const dx = e.clientX - gesture.current.x;
    if (Math.abs(dx) > 3) gesture.current.moved = true;
    const delta = Math.round(dx / DAY_W);
    if (delta !== drag.delta) setDrag({ ...drag, delta });
  };
  const endDrag = (e: React.PointerEvent<HTMLElement>, cancelled = false) => {
    if (!drag || !gesture.current) return;
    const { moved } = gesture.current;
    const current = drag;
    gesture.current = null;
    setDrag(null);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const row = byId.get(current.id);
    if (!row || cancelled) return;
    if (!moved && current.mode === "move") return openTask(current.id);
    if (current.delta === 0) return;
    const next = applyDrag(row.span, current.mode, current.delta);
    updateTask({
      taskId: current.id,
      updateTaskInput: { startDate: next.start, endDate: next.end },
    });
  };

  // --- Link drag: from a bar's right handle onto another bar -> "target is blocked by source"
  const areaPoint = (e: React.PointerEvent) => {
    const r = area.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const startLink = (e: React.PointerEvent<HTMLElement>, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setLink({ fromId: id, ...areaPoint(e) });
  };
  const moveLink = (e: React.PointerEvent<HTMLElement>) => {
    if (link) setLink({ ...link, ...areaPoint(e) });
  };
  const endLink = (e: React.PointerEvent<HTMLElement>) => {
    if (!link) return;
    const fromId = link.fromId;
    setLink(null);
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const targetId = el?.closest<HTMLElement>("[data-task-id]")?.dataset.taskId;
    if (!targetId || targetId === fromId) return;
    if (dependencies.some((d) => d.taskId === targetId && d.dependsOnId === fromId))
      return;
    addDependency({ taskId: targetId, dependsOnId: fromId });
  };

  if (isPending)
    return <TimelineSkeleton />;
  if (!rows.length)
    return (
      <div className="p-6 text-sm text-neutral-500">
        No tasks yet. Add tasks with start and due dates to see them here.
      </div>
    );

  const monthCells: { label: string; days: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(origin, i);
    const last = monthCells.at(-1);
    if (last && isSameMonth(d, addDays(origin, i - 1))) last.days++;
    else monthCells.push({ label: format(d, "MMMM yyyy"), days: 1 });
  }
  const totalH = rows.length * ROW_H;
  const todayX = dayIndex(today, origin) * DAY_W;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-300 px-4 py-2 text-xs text-neutral-500 dark:border-neutral-700">
        <span>
          Drag a bar to move it, drag its edges to resize. Drag the dot at a
          bar&apos;s end onto another bar to mark it &quot;blocked by&quot; the first.
          Click an arrow to remove the link.
        </span>
        <button
          type="button"
          onClick={() => {
            if (scroller.current)
              scroller.current.scrollLeft = Math.max(0, todayX - 240);
          }}
          className="shrink-0 cursor-pointer rounded-md border border-neutral-300 px-2.5 py-1 font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Today
        </button>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-auto">
        <div
          className="flex [--label-w:136px] sm:[--label-w:224px]"
          style={{ width: `calc(var(--label-w) + ${width}px)` }}
        >
          {/* Task names */}
          <div
            className="sticky left-0 z-20 w-(--label-w) shrink-0 border-r border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
          >
            <div
              className="sticky top-0 z-30 flex items-end border-b border-neutral-300 bg-white px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
              style={{ height: HEADER_H }}
            >
              Task
            </div>
            {rows.map(({ task, span }) => (
              <button
                key={task.id}
                type="button"
                onClick={() => openTask(task.id)}
                title={task.name}
                className="flex w-full cursor-pointer items-center gap-2 border-b border-neutral-100 px-3 text-left text-sm text-neutral-800 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800/60"
                style={{ height: ROW_H }}
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    task.status?.type === "done"
                      ? "bg-emerald-500"
                      : span.scheduled
                        ? "bg-violet-500"
                        : "bg-neutral-400"
                  }`}
                />
                <span className="truncate">{task.name}</span>
              </button>
            ))}
          </div>

          {/* Date axis + bars */}
          <div className="relative shrink-0" style={{ width }}>
            <div
              className="sticky top-0 z-10 border-b border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
              style={{ height: HEADER_H }}
            >
              <div className="flex h-6 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                {monthCells.map((m, i) => (
                  <div
                    key={i}
                    className="overflow-hidden whitespace-nowrap border-l border-neutral-200 px-2 py-1 dark:border-neutral-800"
                    style={{ width: m.days * DAY_W }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              <div className="flex h-7 text-[11px] text-neutral-500">
                {Array.from({ length: days }, (_, i) => {
                  const d = addDays(origin, i);
                  return (
                    <div
                      key={i}
                      className={`flex shrink-0 flex-col items-center justify-center border-l border-neutral-100 dark:border-neutral-800 ${
                        i === dayIndex(today, origin)
                          ? "font-bold text-violet-600 dark:text-violet-300"
                          : ""
                      }`}
                      style={{ width: DAY_W }}
                    >
                      {format(d, "d")}
                    </div>
                  );
                })}
              </div>
            </div>

            <div ref={area} className="relative" style={{ height: totalH }}>
              {/* Day grid; weekends shaded */}
              <div className="pointer-events-none absolute inset-0 flex">
                {Array.from({ length: days }, (_, i) => (
                  <div
                    key={i}
                    className={`shrink-0 border-l border-neutral-100 dark:border-neutral-800 ${
                      isWeekend(addDays(origin, i))
                        ? "bg-neutral-50 dark:bg-neutral-800/30"
                        : ""
                    }`}
                    style={{ width: DAY_W }}
                  />
                ))}
              </div>
              {rows.map((_, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute inset-x-0 border-b border-neutral-100 dark:border-neutral-800"
                  style={{ top: (i + 1) * ROW_H - 1 }}
                />
              ))}
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-violet-500/70"
                style={{ left: todayX + DAY_W / 2 }}
              />

              {/* Bars */}
              {rows.map(({ task, span }) => {
                const { x, w, cy } = rectOf(task, span);
                const done = task.status?.type === "done";
                const dragging = drag?.id === task.id;
                return (
                  <div
                    key={task.id}
                    data-task-id={task.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${task.name}, ${format(spanOf(task.id, span).start, "MMM d")} to ${format(spanOf(task.id, span).end, "MMM d")}`}
                    onKeyDown={(e) => e.key === "Enter" && openTask(task.id)}
                    onPointerDown={(e) => startDrag(e, task.id, "move")}
                    onPointerMove={moveDrag}
                    onPointerUp={(e) => endDrag(e)}
                    onPointerCancel={(e) => endDrag(e, true)}
                    title={`${task.name}${span.scheduled ? "" : " (no dates: drag to schedule)"}`}
                    className={`group absolute flex cursor-grab touch-none select-none items-center overflow-visible rounded-md px-2 text-xs font-medium text-white shadow-sm ${
                      dragging ? "z-20 cursor-grabbing ring-2 ring-violet-300" : ""
                    } ${
                      !span.scheduled
                        ? "border border-dashed border-neutral-400 bg-neutral-300 !text-neutral-700 dark:bg-neutral-700 dark:!text-neutral-200"
                        : done
                          ? "bg-emerald-500"
                          : "bg-violet-600"
                    }`}
                    style={{
                      left: x + 2,
                      width: Math.max(w - 4, 8),
                      top: cy - BAR_H / 2,
                      height: BAR_H,
                    }}
                  >
                    <span
                      aria-hidden
                      onPointerDown={(e) => startDrag(e, task.id, "start")}
                      onPointerMove={moveDrag}
                      onPointerUp={(e) => endDrag(e)}
                      onPointerCancel={(e) => endDrag(e, true)}
                      className="absolute inset-y-0 left-0 w-2 cursor-ew-resize rounded-l-md hover:bg-black/25"
                    />
                    <span className="pointer-events-none truncate">{task.name}</span>
                    <span
                      aria-hidden
                      onPointerDown={(e) => startDrag(e, task.id, "end")}
                      onPointerMove={moveDrag}
                      onPointerUp={(e) => endDrag(e)}
                      onPointerCancel={(e) => endDrag(e, true)}
                      className="absolute inset-y-0 right-0 w-2 cursor-ew-resize rounded-r-md hover:bg-black/25"
                    />
                    <span
                      title="Drag onto another task to make it blocked by this one"
                      onPointerDown={(e) => startLink(e, task.id)}
                      onPointerMove={moveLink}
                      onPointerUp={endLink}
                      onPointerCancel={() => setLink(null)}
                      className="absolute -right-2.5 top-1/2 z-10 size-3 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-violet-500 bg-white opacity-0 group-hover:opacity-100 focus:opacity-100 dark:bg-neutral-900"
                    />
                  </div>
                );
              })}

              {/* Dependency arrows */}
              <svg
                className="pointer-events-none absolute inset-0 z-10"
                width={width}
                height={totalH}
              >
                <defs>
                  <marker
                    id="tl-arrow"
                    viewBox="0 0 8 8"
                    refX="7"
                    refY="4"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 z" className="fill-neutral-500" />
                  </marker>
                </defs>
                {dependencies.map((dep) => {
                  const blocked = byId.get(dep.taskId);
                  const blocker = byId.get(dep.dependsOnId);
                  if (!blocked || !blocker) return null;
                  const a = rectOf(blocker.task, blocker.span);
                  const b = rectOf(blocked.task, blocked.span);
                  const d = arrowPath(a.x + a.w - 2, a.cy, b.x + 2, b.cy);
                  return (
                    <g key={`${dep.taskId}-${dep.dependsOnId}`}>
                      <path
                        d={d}
                        fill="none"
                        strokeWidth={1.5}
                        markerEnd="url(#tl-arrow)"
                        className="stroke-neutral-500"
                      />
                      <path
                        d={d}
                        fill="none"
                        strokeWidth={10}
                        stroke="transparent"
                        className="pointer-events-stroke cursor-pointer"
                        style={{ pointerEvents: "stroke" }}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove link: "${blocked.task.name}" blocked by "${blocker.task.name}"?`,
                            )
                          )
                            removeDependency(dep);
                        }}
                      >
                        <title>{`${blocked.task.name} is blocked by ${blocker.task.name} (click to remove)`}</title>
                      </path>
                    </g>
                  );
                })}
                {link &&
                  (() => {
                    const from = byId.get(link.fromId);
                    if (!from) return null;
                    const a = rectOf(from.task, from.span);
                    return (
                      <path
                        d={`M${a.x + a.w - 2},${a.cy} L${link.x},${link.y}`}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        fill="none"
                        className="stroke-violet-500"
                      />
                    );
                  })()}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TimelineView;
