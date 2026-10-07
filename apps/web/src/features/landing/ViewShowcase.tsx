"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ChartColumn,
  ChartGantt,
  MessagesSquare,
  Network,
  PanelRight,
  SquareKanban,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

const VIEWS: {
  key: string;
  label: string;
  Icon: LucideIcon;
  caption: string;
  alt: string;
}[] = [
  {
    key: "board",
    label: "Board",
    Icon: SquareKanban,
    caption:
      "Drag cards across your own statuses. Group by assignee or priority, set WIP limits, and save the view.",
    alt: "Board view with statuses, assignees and priorities",
  },
  {
    key: "timeline",
    label: "Timeline",
    Icon: ChartGantt,
    caption:
      "Drag bars to reschedule and draw “blocked by” links, so you see a slip before it costs a week.",
    alt: "Timeline view with dependency arrows",
  },
  {
    key: "task",
    label: "Task",
    Icon: PanelRight,
    caption:
      "Subtasks, checklists, comments with @mentions, time tracking and an activity log, all on one task.",
    alt: "Task panel with description, subtasks and activity",
  },
  {
    key: "workload",
    label: "Workload",
    Icon: UsersRound,
    caption:
      "See who is overloaded this week against their capacity, then drag a task to someone with room.",
    alt: "Workload view with an overloaded teammate highlighted in red",
  },
  {
    key: "mindmap",
    label: "Mind Map",
    Icon: Network,
    caption:
      "Tasks and their subtasks as a zoomable tree. Add a child node and it becomes a subtask.",
    alt: "Mind map of a sprint's tasks and nested subtasks",
  },
  {
    key: "chat",
    label: "Chat",
    Icon: MessagesSquare,
    caption:
      "Channels per space with @mentions and threads. Turn any message into a task in one click.",
    alt: "Product chat channel with mentions, reactions and a linked task",
  },
  {
    key: "dashboard",
    label: "Dashboard",
    Icon: ChartColumn,
    caption:
      "Workload by person, overdue work and a sprint burndown, built from the tasks you already have.",
    alt: "Dashboard with workload and burndown charts",
  },
];

function ViewShowcase() {
  const [active, setActive] = useState(0);
  const view = VIEWS[active]!;
  const sizes = "(min-width: 1200px) 1150px, 100vw";

  return (
    <div>
      <div
        role="tablist"
        aria-label="Views"
        className="flex gap-1 overflow-x-auto border-b border-[#e8e8ee] dark:border-neutral-800"
      >
        {VIEWS.map((v, i) => {
          const selected = i === active;
          return (
            <button
              key={v.key}
              role="tab"
              type="button"
              id={`view-tab-${v.key}`}
              aria-selected={selected}
              aria-controls="view-panel"
              onClick={() => setActive(i)}
              className={`-mb-px flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold outline-none transition-colors focus-visible:bg-[#f4f2ff] sm:px-4 dark:focus-visible:bg-neutral-900 ${
                selected
                  ? "border-[#7b68ee] text-[#1f1f2e] dark:text-white"
                  : "border-transparent text-[#6b6b7b] hover:text-[#1f1f2e] dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              <v.Icon className="size-4" strokeWidth={2.2} />
              {v.label}
            </button>
          );
        })}
      </div>

      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#55556a] dark:text-neutral-400">
        {view.caption}
      </p>

      <div
        id="view-panel"
        role="tabpanel"
        aria-labelledby={`view-tab-${view.key}`}
        className="mt-6 overflow-hidden rounded-xl border border-[#e8e8ee] bg-white shadow-[0_24px_60px_-24px_rgba(31,31,46,0.25)] dark:border-neutral-800 dark:bg-neutral-900"
      >
        {VIEWS.map((v, i) => (
          <div key={v.key} className={i === active ? "block" : "hidden"}>
            <Image
              width={1440}
              height={900}
              alt={v.alt}
              sizes={sizes}
              priority={i === 0}
              src={`/landing/${v.key}-light.webp`}
              className="h-auto w-full dark:hidden"
            />
            <Image
              width={1440}
              height={900}
              alt={v.alt}
              sizes={sizes}
              priority={i === 0}
              src={`/landing/${v.key}-dark.webp`}
              className="hidden h-auto w-full dark:block"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ViewShowcase;
