"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FoldVertical, Info, Maximize, Minus, Plus, RotateCcw, UnfoldVertical } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrentList } from "@/features/sprint/components/SprintBar";
import { useStatuses } from "@/features/status/hooks/useStatuses";
import { findOpenStatus } from "@/features/status/lib/statusByType";
import type { Status } from "@/features/status/types";
import { createTaskAction } from "@/features/task/actions";
import { TASK_REVALIDATE_TIME } from "@/features/task/constants/tasks.const";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import type { Task } from "@/features/task/types";
import { createSubtaskAction } from "@/features/taskDetail/actions/taskDetail.actions";
import { useOpenTask } from "@/features/taskDetail/hooks/useTaskParam";
import { ViewToolbar } from "@/features/viewConfig/components/ViewToolbar";
import { useViewTasks } from "@/features/viewConfig/hooks/useViewTasks";
import { axiosClient } from "@/shared/lib/axios/client";
import { cn } from "@/shared/lib/utils/cn";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import type { ActionErrorResponse } from "@/shared/types/action.types";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import {
  ROOT_ID,
  buildMindTree,
  clampZoom,
  collapsibleIds,
  edgePath,
  fitView,
  layoutTree,
  initialView,
  resetView,
  zoomAt,
  type MindLayout,
  type View,
} from "../mindmap.lib";
import { MindMapNodeView, sizeOf, type NodeHandlers } from "./MindMapNodes";

/** Under ["tasks", listId] so every task write that refreshes the list also refreshes the map. */
const mindMapKey = (listId: string) => ["tasks", listId, "mindmap"] as const;
const GROUP_KEY = "mindmap:groupByStatus";
const collapsedKey = (listId: string) => `mindmap:collapsed:${listId}`;
const ZOOM_STEP = 1.25;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: the map still works, it just forgets.
  }
}

/** Every task of the list, subtasks at every depth included. */
function useMindMapTasks(listId: string) {
  return useQuery({
    queryKey: mindMapKey(listId),
    queryFn: () => axiosClient.get<Task[]>(`/api/tasks?listId=${listId}&subtasks=true`),
    enabled: !!listId,
    staleTime: TASK_REVALIDATE_TIME,
  });
}

interface CreateArgs {
  name: string;
  /** Set for a subtask. */
  parentTaskId?: string;
  /** Top-level tasks: the status node it was added under, else the list's open status. */
  status?: Status;
}

/** Creates a task or subtask with an optimistic node, then refetches. */
function useCreateFromMap(listId: string, statuses: Status[] | undefined) {
  const queryClient = useQueryClient();
  const key = mindMapKey(listId);
  return useMutation({
    mutationFn: async ({ name, parentTaskId, status }: CreateArgs) => {
      const res = parentTaskId
        ? await createSubtaskAction(parentTaskId, name, listId)
        : await createTaskAction({ listId, name, statusId: status!.id, priority: "none" });
      if (res.status === "error") throw res;
      return res;
    },
    async onMutate({ name, parentTaskId, status }) {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const shown = status ?? findOpenStatus(statuses);
      const temp = {
        id: tempId,
        name,
        listId,
        statusId: shown?.id ?? "",
        status: shown,
        priority: "none",
        parentTaskId: parentTaskId ?? null,
        assignees: [],
        points: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Task;
      queryClient.setQueryData<Task[]>(key, (old = []) => [...old, temp]);
      return { previous, tempId };
    },
    onError(error: ActionErrorResponse, _args, context) {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      window.toast?.error(formatErrorForToast(error.error), 7);
    },
    onSuccess(res, _args, context) {
      if (res.status !== "success" || !("payload" in res)) return;
      const payload = res.payload as Task | { newTask: Task };
      const created = "newTask" in payload ? payload.newTask : payload;
      queryClient.setQueryData<Task[]>(key, (old = []) => old.map((t) => (t.id === context.tempId ? created : t)));
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
      queryClient.invalidateQueries({ queryKey: ["task"] });
    },
  });
}

const Edges = memo(function Edges({ layout }: { layout: MindLayout }) {
  return (
    <svg
      width={layout.width}
      height={layout.height}
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
      aria-hidden
    >
      {layout.edges.map(({ from, to }) => (
        <path
          key={`${from.node.id}>${to.node.id}`}
          d={edgePath(from, to)}
          fill="none"
          strokeWidth={1.5}
          className={cn(
            "stroke-neutral-300 dark:stroke-neutral-600",
            to.node.kind === "draft" && "stroke-violet-400 [stroke-dasharray:4_4] dark:stroke-violet-500",
          )}
        />
      ))}
    </svg>
  );
});

const Nodes = memo(function Nodes({
  layout,
  listName,
  editingId,
  setEditingId,
  handlers,
}: {
  layout: MindLayout;
  listName: string;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  handlers: NodeHandlers;
}) {
  return layout.nodes.map((placed) => (
    <MindMapNodeView
      key={placed.node.id}
      placed={placed}
      listName={listName}
      editing={editingId === placed.node.id}
      setEditing={setEditingId}
      handlers={handlers}
    />
  ));
});

const ctrlBtn =
  "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800";
const barBtn =
  "inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800";

function MindMapCanvas({ listId }: { listId: string }) {
  const { data: allTasks, isPending } = useMindMapTasks(listId);
  const { tasks: viewTasks } = useViewTasks();
  const { statuses } = useStatuses();
  const list = useCurrentList();
  const openTask = useOpenTask();
  const { updateTask } = useUpdateTask();
  const queryClient = useQueryClient();
  const create = useCreateFromMap(listId, statuses);

  const [groupByStatus, setGroupByStatusState] = useState(() => readStorage(GROUP_KEY, true));
  const [collapsed, setCollapsedState] = useState(() => new Set(readStorage<string[]>(collapsedKey(listId), [])));
  const [draftParent, setDraftParent] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoomPct, setZoomPct] = useState(100);

  const setGroupByStatus = (next: boolean) => {
    setGroupByStatusState(next);
    writeStorage(GROUP_KEY, next);
  };
  const setCollapsed = useCallback(
    (update: (prev: Set<string>) => Set<string>) =>
      setCollapsedState((prev) => {
        const next = update(prev);
        writeStorage(collapsedKey(listId), [...next]);
        return next;
      }),
    [listId],
  );

  const topLevelOrder = useMemo(() => viewTasks?.map((t) => t.id), [viewTasks]);
  const tree = useMemo(
    () =>
      buildMindTree({
        tasks: allTasks ?? [],
        statuses: statuses ?? [],
        groupByStatus,
        topLevelOrder,
        draftParentId: draftParent,
      }),
    [allTasks, statuses, groupByStatus, topLevelOrder, draftParent],
  );
  const layout = useMemo(() => layoutTree(tree, sizeOf, { collapsed }), [tree, collapsed]);

  // --- View transform (applied straight to the DOM so panning never re-renders the nodes) ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>({ x: 0, y: 0, k: 1 });
  const apply = useCallback((v: View, animate = false) => {
    viewRef.current = v;
    const el = contentRef.current;
    if (el) {
      el.style.transition = animate ? "transform 180ms ease-out" : "";
      el.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.k})`;
    }
    const vp = viewportRef.current;
    if (vp) {
      vp.style.backgroundPosition = `${v.x}px ${v.y}px`;
      vp.style.backgroundSize = `${22 * v.k}px ${22 * v.k}px`;
    }
    setZoomPct(Math.round(v.k * 100));
  }, []);
  const viewportSize = () => {
    const r = viewportRef.current?.getBoundingClientRect();
    return { w: r?.width ?? 0, h: r?.height ?? 0 };
  };
  // Latest values for stable callbacks (synced before the fit effect below runs).
  const layoutRef = useRef(layout);
  const statusesRef = useRef(statuses);
  const draftRef = useRef(draftParent);
  useLayoutEffect(() => {
    layoutRef.current = layout;
    statusesRef.current = statuses;
    draftRef.current = draftParent;
  }, [layout, statuses, draftParent]);
  const fit = useCallback(
    (animate = true) => apply(fitView({ w: layoutRef.current.width, h: layoutRef.current.height }, viewportSize()), animate),
    [apply],
  );
  const reset = useCallback(() => {
    const root = layoutRef.current.nodes.find((n) => n.node.id === ROOT_ID);
    apply(resetView(root ? root.y + root.h / 2 : 0, viewportSize()), true);
  }, [apply]);
  const zoomBy = useCallback(
    (factor: number) => {
      const { w, h } = viewportSize();
      const v = viewRef.current;
      apply(zoomAt(v, clampZoom(v.k * factor), w / 2, h / 2), true);
    },
    [apply],
  );

  // Fit to screen once the first data is laid out.
  const fitted = useRef(false);
  const ready = !isPending && !!statuses;
  useLayoutEffect(() => {
    if (!ready || fitted.current) return;
    fitted.current = true;
    const { width, height, nodes } = layoutRef.current;
    const root = nodes.find((n) => n.node.id === ROOT_ID);
    apply(initialView({ w: width, h: height }, root ? root.y + root.h / 2 : height / 2, viewportSize()));
  }, [ready, apply]);

  // Wheel / trackpad pinch: zoom around the cursor (non-passive so the page does not scroll).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      const v = viewRef.current;
      apply(zoomAt(v, v.k * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left, e.clientY - r.top));
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [apply, ready]);

  // Keyboard: + / - / 0 (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "+" || e.key === "=") zoomBy(ZOOM_STEP);
      else if (e.key === "-" || e.key === "_") zoomBy(1 / ZOOM_STEP);
      else if (e.key === "0") reset();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomBy, reset]);

  // Drag to pan (mouse or one finger), two fingers to pinch. A drag that moved suppresses the click.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | { kind: "pan"; x: number; y: number; view: View; active: boolean }
    | { kind: "pinch"; dist: number; mx: number; my: number; view: View }
    | null
  >(null);
  const dragged = useRef(false);
  const local = (e: { clientX: number; clientY: number }) => {
    const r = viewportRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }];
      gesture.current = {
        kind: "pinch",
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
        view: viewRef.current,
      };
    } else if (pts.length === 1) {
      gesture.current = { kind: "pan", x: pts[0]!.x, y: pts[0]!.y, view: viewRef.current, active: gesture.current !== null };
    } else gesture.current = null;
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-mm-ui], input, textarea")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, local(e));
    if (pointers.current.size === 1) dragged.current = false;
    startGesture();
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pan") {
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      if (!g.active) {
        if (Math.hypot(dx, dy) < 4) return;
        g.active = true;
        dragged.current = true;
        viewportRef.current?.setPointerCapture(e.pointerId);
      }
      apply({ ...g.view, x: g.view.x + dx, y: g.view.y + dy });
    } else {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const zoomed = zoomAt(g.view, g.view.k * (dist / g.dist), g.mx, g.my);
      dragged.current = true;
      apply({ ...zoomed, x: zoomed.x + mx - g.mx, y: zoomed.y + my - g.my });
    }
  };
  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    startGesture();
  };

  // --- Node actions ---
  const listName = list?.name ?? "List";
  const createTask = create.mutate;

  const handlers = useMemo<NodeHandlers>(
    () => ({
      onOpen: openTask,
      onToggle: (id) =>
        setCollapsed((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      onAddChild: (id) => {
        setEditingId(null);
        setCollapsed((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setDraftParent(id);
      },
      onRename: (taskId, name) => {
        queryClient.setQueryData<Task[]>(mindMapKey(listId), (old) =>
          old?.map((t) => (t.id === taskId ? { ...t, name } : t)),
        );
        updateTask({ taskId, updateTaskInput: { name } });
      },
      onDraftSubmit: (name, another) => {
        const parent = draftRef.current;
        if (!parent) return;
        const all = statusesRef.current;
        if (parent === ROOT_ID) {
          const status = findOpenStatus(all);
          if (status) createTask({ name, status });
        } else if (parent.startsWith("status:")) {
          const status = all?.find((s) => `status:${s.id}` === parent);
          if (status) createTask({ name, status });
        } else createTask({ name, parentTaskId: parent });
        if (!another) setDraftParent(null);
      },
      onDraftCancel: () => setDraftParent(null),
    }),
    // Statuses and the draft parent are read through refs so the nodes keep stable handlers.
    [openTask, setCollapsed, queryClient, listId, updateTask, createTask],
  );

  const collapseAll = () => setCollapsed(() => new Set(collapsibleIds(tree)));
  const expandAll = () => setCollapsed(() => new Set());

  if (isPending || !statuses)
    return (
      <div className="flex-1 p-4">
        <SkeletonLoader height="h-full" width="w-full" rounded="rounded-xl" />
      </div>
    );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-neutral-700 select-none dark:text-neutral-200">
          <button
            type="button"
            role="switch"
            aria-checked={groupByStatus}
            onClick={() => setGroupByStatus(!groupByStatus)}
            className={cn(
              "relative inline-flex h-4 w-7 cursor-pointer items-center rounded-full transition",
              groupByStatus ? "bg-violet-600" : "bg-neutral-300 dark:bg-neutral-600",
            )}
          >
            <span
              className={cn(
                "inline-block size-3 rounded-full bg-white shadow transition",
                groupByStatus ? "translate-x-3.5" : "translate-x-0.5",
              )}
            />
          </button>
          Group by status
        </label>
        <span className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
        <button type="button" onClick={expandAll} className={barBtn}>
          <UnfoldVertical className="size-3.5" /> Expand all
        </button>
        <button type="button" onClick={collapseAll} className={barBtn}>
          <FoldVertical className="size-3.5" /> Collapse all
        </button>
        <div className="ml-auto">
          <Popover>
            <PopoverTrigger className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="How the mind map works">
              <Info className="size-4" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              <p className="mb-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Mind Map</p>
              <p>The list, its statuses, its tasks and their subtasks (up to 3 levels deep) as a tree.</p>
              <p className="mt-1.5">
                Hover a node and click <b>+</b> to add a task or subtask: <b>Enter</b> saves, <b>Tab</b> saves and starts
                another, <b>Esc</b> cancels. Click a task to open it, double-click to rename.
              </p>
              <p className="mt-1.5">
                Scroll or pinch to zoom, drag to pan. Keys: <b>+</b> / <b>−</b> zoom, <b>0</b> resets.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={(e) => {
          if (dragged.current) {
            e.stopPropagation();
            e.preventDefault();
            dragged.current = false;
          }
        }}
        className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden border-t border-neutral-200 bg-neutral-50 select-none active:cursor-grabbing dark:border-neutral-800 dark:bg-neutral-950"
        style={{
          backgroundImage: "radial-gradient(circle, var(--mm-dot) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div
          ref={contentRef}
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{ width: layout.width, height: layout.height }}
        >
          <Edges layout={layout} />
          <Nodes
            layout={layout}
            listName={listName}
            editingId={editingId}
            setEditingId={setEditingId}
            handlers={handlers}
          />
        </div>

        <div
          data-mm-ui
          className="absolute right-3 bottom-3 flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5 shadow-md dark:border-neutral-700 dark:bg-neutral-900"
        >
          <button type="button" onClick={() => zoomBy(1 / ZOOM_STEP)} className={ctrlBtn} aria-label="Zoom out" title="Zoom out (−)">
            <Minus className="size-4" />
          </button>
          <span className="w-11 text-center text-xs font-semibold text-neutral-700 tabular-nums dark:text-neutral-200" aria-live="polite">
            {zoomPct}%
          </span>
          <button type="button" onClick={() => zoomBy(ZOOM_STEP)} className={ctrlBtn} aria-label="Zoom in" title="Zoom in (+)">
            <Plus className="size-4" />
          </button>
          <span className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
          <button type="button" onClick={() => fit()} className={ctrlBtn} title="Fit to screen">
            <Maximize className="size-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Fit</span>
          </button>
          <button type="button" onClick={reset} className={ctrlBtn} title="Reset to 100% (0)">
            <RotateCcw className="size-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </>
  );
}

/** Mind Map view: the list as a zoomable tree of statuses, tasks and nested subtasks. */
function MindMapView() {
  const { listId } = useParams<{ listId: string }>();
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden [--mm-dot:rgba(0,0,0,0.13)] dark:[--mm-dot:rgba(255,255,255,0.09)]">
      <ViewToolbar />
      <MindMapCanvas key={listId} listId={listId} />
    </section>
  );
}

export default MindMapView;
