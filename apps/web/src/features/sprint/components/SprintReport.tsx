"use client";

import { useParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { tooltipStyle } from "@/features/dashboard/tooltipStyle";
import { useSprintReport, useSprintSummary } from "../hooks";
import { sprintRange } from "../lib";
import SprintStateBadge from "./SprintStateBadge";

const card = "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900";
const today = () => new Date().toISOString().slice(0, 10);

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={`${card} flex flex-col gap-1`}>
      <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">{label}</span>
      <span className="text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-50">{value}</span>
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </div>
  );
}

/** Sprint report: summary numbers, the burndown over the sprint's days and the space's velocity. */
function SprintReport() {
  const { listId } = useParams<{ listId: string }>();
  const { data: report, isPending, error } = useSprintReport(listId);
  const { data: summary } = useSprintSummary(listId);

  if (error)
    return <p className="p-8 text-center text-sm text-neutral-500">This list is not a sprint, or the report could not load.</p>;
  if (isPending || !report)
    return (
      <div className="grid gap-4 p-4 lg:p-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );

  const { sprint, burndown, velocity } = report;
  const unit = burndown.unit === "points" ? "pts" : "tasks";
  const todayKey = today();
  const showToday = burndown.points.some((p) => p.date === todayKey) && sprint.sprintState === "active";
  const lastRemaining = [...burndown.points].reverse().find((p) => p.remaining !== null)?.remaining ?? burndown.total;

  return (
    <main className="flex flex-col gap-6 p-3 text-neutral-600 sm:p-4 lg:p-8 dark:text-neutral-400">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">{sprint.name} report</h2>
        <span className="text-sm text-neutral-500">{sprintRange(sprint.sprintStart, sprint.sprintEnd)}</span>
        <SprintStateBadge state={sprint.sprintState} />
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Committed" value={`${burndown.total} ${unit}`} hint={`${summary?.taskCount ?? "–"} tasks in the sprint`} />
        <Metric
          label="Completed"
          value={`${burndown.total - lastRemaining} ${unit}`}
          hint={burndown.total ? `${Math.round(((burndown.total - lastRemaining) / burndown.total) * 100)}% of the commitment` : undefined}
        />
        <Metric
          label="Remaining"
          value={`${lastRemaining} ${unit}`}
          hint={burndown.carriedOutCount ? `${burndown.carriedOutCount} carried to the next sprint` : undefined}
        />
        <Metric
          label="Avg. velocity"
          value={velocity.sprints.length ? `${velocity.average} pts` : "–"}
          hint={velocity.sprints.length ? `last ${velocity.sprints.length} finished sprints` : "no finished sprints yet"}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={card}>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Burndown</h3>
            <span className="text-xs text-neutral-500">Remaining {unit} per day</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndown.points} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#52525244" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d: string) => format(new Date(`${d}T12:00:00`), "MMM d")}
                  minTickGap={12}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  {...tooltipStyle}
                  labelFormatter={(d) => format(new Date(`${String(d)}T12:00:00`), "EEE, MMM d")}
                />
                <Legend />
                {showToday && (
                  <ReferenceLine x={todayKey} stroke="#a3a3a3" strokeDasharray="4 4" label={{ value: "Today", fontSize: 11, fill: "#a3a3a3", position: "insideTopRight" }} />
                )}
                <Line
                  type="linear"
                  dataKey="ideal"
                  name="Ideal"
                  stroke="#a3a3a3"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="remaining"
                  name="Remaining"
                  stroke="#7b68ee"
                  strokeWidth={2.5}
                  dot={{ r: 2.5 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Velocity</h3>
            <span className="text-xs text-neutral-500">Committed vs completed points</span>
          </div>
          <div className="h-72 w-full">
            {velocity.sprints.length === 0 ? (
              <p className="py-24 text-center text-sm">Complete a sprint to see its velocity here.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocity.sprints} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#52525244" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: "#52525222" }} />
                  <Legend />
                  <ReferenceLine
                    y={velocity.average}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: `avg ${velocity.average}`, fontSize: 11, fill: "#10b981", position: "insideTopLeft" }}
                  />
                  <Bar dataKey="committed" name="Committed" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#7b68ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default SprintReport;
