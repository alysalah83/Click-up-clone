"use client";

import { memo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronRight, Network, Plus } from "lucide-react";
import { AvatarStack } from "@/features/members/components/UserAvatar";
import { TASK_PRIORITIES_LIST } from "@/features/task/constants/tasks.const";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import type { ColorsToken } from "@/shared/ui/ColorPicker/types";
import { cn } from "@/shared/lib/utils/cn";
import { canAddChild, type MindNode, type PlacedNode, type Size } from "../mindmap.lib";

export const NODE_SIZES: Record<MindNode["kind"], Size> = {
  root: { w: 232, h: 64 },
  status: { w: 176, h: 40 },
  task: { w: 252, h: 78 },
  draft: { w: 252, h: 48 },
};
export const sizeOf = (node: MindNode) => NODE_SIZES[node.kind];

export const statusHex = (status: { bgColor?: string } | undefined) =>
  COLORS_TOKENS[status?.bgColor as ColorsToken]?.hex ?? "#a3a3a3";

export interface NodeHandlers {
  onOpen: (taskId: string) => void;
  onToggle: (nodeId: string) => void;
  onAddChild: (nodeId: string) => void;
  onRename: (taskId: string, name: string) => void;
  onDraftSubmit: (name: string, another: boolean) => void;
  onDraftCancel: () => void;
}

const card =
  "rounded-lg border border-neutral-200 bg-white shadow-xs transition dark:border-neutral-700 dark:bg-neutral-800";

/** Child count + chevron that collapses or expands the branch. */
function ToggleButton({ node, collapsed, onToggle, className }: { node: MindNode; collapsed: boolean; onToggle: (id: string) => void; className?: string }) {
  if (!node.count) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(node.id);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      aria-label={collapsed ? "Expand" : "Collapse"}
      aria-expanded={!collapsed}
      title={collapsed ? "Expand" : "Collapse"}
      className={cn(
        "inline-flex h-5 shrink-0 cursor-pointer items-center gap-0.5 rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition",
        collapsed
          ? "bg-violet-600 text-white hover:bg-violet-700"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600",
        className,
      )}
    >
      <ChevronRight className={cn("size-3 transition-transform", !collapsed && "rotate-90")} />
      {node.count}
    </button>
  );
}

/** The "+" on a node's right edge (shown on hover, always on touch screens). */
function AddButton({ node, onAddChild }: { node: MindNode; onAddChild: (id: string) => void }) {
  if (!canAddChild(node)) return null;
  const label = node.kind === "task" ? "Add subtask" : "Add task";
  return (
    <button
      type="button"
      data-mm-ui
      onClick={(e) => {
        e.stopPropagation();
        onAddChild(node.id);
      }}
      aria-label={label}
      title={label}
      className="absolute top-1/2 -right-3 z-10 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-violet-600 text-white opacity-0 shadow-md ring-2 ring-white transition group-hover:opacity-100 hover:bg-violet-700 focus-visible:opacity-100 dark:ring-neutral-900 [@media(hover:none)]:opacity-100"
    >
      <Plus className="size-3.5" />
    </button>
  );
}

function NameInput({
  initial = "",
  placeholder,
  onSubmit,
  onCancel,
  allowTab,
}: {
  initial?: string;
  placeholder: string;
  onSubmit: (name: string, another: boolean) => void;
  onCancel: () => void;
  allowTab?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const done = useRef(false);
  const finish = (another: boolean) => {
    if (done.current) return;
    const name = value.trim();
    if (!name) {
      done.current = true;
      onCancel();
      return;
    }
    if (!another) done.current = true;
    onSubmit(name, another);
    if (another) setValue("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      finish(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      done.current = true;
      onCancel();
    } else if (e.key === "Tab" && allowTab && value.trim()) {
      e.preventDefault();
      finish(true);
    }
  };
  return (
    <input
      autoFocus
      value={value}
      maxLength={128}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={() => finish(false)}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full min-w-0 bg-transparent text-[13px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
    />
  );
}

function TaskCard({
  placed,
  editing,
  setEditing,
  handlers,
}: {
  placed: PlacedNode;
  editing: boolean;
  setEditing: (id: string | null) => void;
  handlers: NodeHandlers;
}) {
  const { node, collapsed } = placed;
  const task = node.task!;
  const clickTimer = useRef<number | undefined>(undefined);
  const temp = task.id.startsWith("temp-");
  const done = task.status?.type === "done";
  const priority = TASK_PRIORITIES_LIST.find((p) => p.label.toLowerCase() === task.priority);
  const color = statusHex(task.status);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={task.name}
      onClick={() => {
        if (temp || editing) return;
        window.clearTimeout(clickTimer.current);
        // Wait a moment so a double-click renames instead of opening the panel.
        clickTimer.current = window.setTimeout(() => handlers.onOpen(task.id), 220);
      }}
      onDoubleClick={() => {
        window.clearTimeout(clickTimer.current);
        if (!temp) setEditing(task.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !temp && !editing) handlers.onOpen(task.id);
        if (e.key === "F2" && !temp) setEditing(task.id);
      }}
      title={task.name}
      style={{ borderLeftColor: color }}
      className={cn(
        card,
        "flex h-full cursor-pointer flex-col justify-between border-l-4 px-2.5 py-2 hover:border-violet-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-violet-500",
        temp && "animate-pulse",
      )}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} title={task.status?.name} />
        {editing ? (
          <NameInput
            initial={task.name}
            placeholder="Task name"
            onSubmit={(name) => {
              setEditing(null);
              if (name !== task.name) handlers.onRename(task.id, name);
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <p
            className={cn(
              "line-clamp-2 min-w-0 text-[13px] leading-snug font-medium text-neutral-900 dark:text-neutral-100",
              done && "text-neutral-500 line-through dark:text-neutral-400",
            )}
          >
            {task.name}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {task.assignees?.length ? <AvatarStack users={task.assignees} max={3} size="xs" /> : null}
        {priority && (
          <span title={`${priority.label} priority`}>
            <ICONS_MAP.flag className={cn("size-3", priority.iconColor)} />
          </span>
        )}
        {task.points != null && (
          <span
            title="Sprint points"
            className="rounded bg-neutral-100 px-1 text-[10px] font-semibold tabular-nums text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
          >
            {task.points}
          </span>
        )}
        <span className="flex-1" />
        <ToggleButton node={node} collapsed={collapsed} onToggle={handlers.onToggle} />
      </div>
    </div>
  );
}

/** One positioned node: the list root, a status, a task card or the "new task" input. */
export const MindMapNodeView = memo(function MindMapNodeView({
  placed,
  listName,
  editing,
  setEditing,
  handlers,
}: {
  placed: PlacedNode;
  listName: string;
  editing: boolean;
  setEditing: (id: string | null) => void;
  handlers: NodeHandlers;
}) {
  const { node, x, y, w, h, collapsed } = placed;

  let body: React.ReactNode;
  if (node.kind === "root") {
    body = (
      <div className="flex h-full items-center gap-2.5 rounded-xl bg-violet-600 px-3 text-white shadow-md">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <Network className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" title={listName}>
            {listName}
          </p>
          <p className="text-xs text-violet-100">
            {node.count} {node.count === 1 ? "task" : "tasks"}
          </p>
        </div>
        <ToggleButton
          node={node}
          collapsed={collapsed}
          onToggle={handlers.onToggle}
          className={collapsed ? "bg-white text-violet-700 hover:bg-violet-50" : "bg-white/15 text-white hover:bg-white/25"}
        />
      </div>
    );
  } else if (node.kind === "status") {
    const color = statusHex(node.status);
    body = (
      <div
        className={cn(card, "flex h-full items-center gap-2 rounded-full px-3")}
        style={{ borderColor: color }}
      >
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-wide uppercase" style={{ color }}>
          {node.status?.name}
        </span>
        {node.count > 0 ? (
          <ToggleButton node={node} collapsed={collapsed} onToggle={handlers.onToggle} />
        ) : (
          <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">0</span>
        )}
      </div>
    );
  } else if (node.kind === "draft") {
    body = (
      <div className={cn(card, "flex h-full items-center gap-2 border-violet-400 px-3 ring-2 ring-violet-200 dark:ring-violet-900")}>
        <Plus className="size-3.5 shrink-0 text-violet-500" />
        <NameInput
          placeholder={node.depth > 0 ? "Subtask name, Enter to save" : "Task name, Enter to save"}
          onSubmit={handlers.onDraftSubmit}
          onCancel={handlers.onDraftCancel}
          allowTab
        />
      </div>
    );
  } else {
    body = <TaskCard placed={placed} editing={editing} setEditing={setEditing} handlers={handlers} />;
  }

  return (
    <div data-mm-node className="group absolute" style={{ left: x, top: y, width: w, height: h }}>
      {body}
      {node.kind !== "draft" && !editing && <AddButton node={node} onAddChild={handlers.onAddChild} />}
    </div>
  );
});
