import { getDashboardSummary } from "./api";
import { formatDuration } from "@/features/taskDetail/lib/duration";
import TimeTrackedChart from "./TimeTrackedChart";
import WorkloadChart from "./WorkloadChart";

const card =
  "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900";

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className={`${card} flex flex-col gap-2`}>
      <h3 className="text-base font-semibold tracking-wide">{label}</h3>
      <span className={`text-4xl font-semibold tabular-nums ${tone ?? "text-neutral-900 dark:text-neutral-300"}`}>
        {value}
      </span>
    </div>
  );
}

async function DashboardMetrics() {
  const { overdue, completedThisWeek, workload, timeTrackedThisWeekSec, timeByMember } = await getDashboardSummary();
  return (
    <>
      <Stat label="Overdue" value={overdue} tone={overdue > 0 ? "text-red-500" : undefined} />
      <Stat label="Completed this week" value={completedThisWeek} tone="text-emerald-500" />
      <Stat label="Tracked this week" value={formatDuration(timeTrackedThisWeekSec)} tone="text-sky-500" />
      <div className={`${card} flex flex-col gap-2`}>
        <h3 className="text-base font-semibold tracking-wide">Tracking members</h3>
        <span className="text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-300">{timeByMember.length}</span>
      </div>
      <div className={`${card} sm:col-span-2`}>
        <h3 className="mb-2 text-xl font-semibold">Tasks by assignee</h3>
        <WorkloadChart data={workload} />
      </div>
      <div className={`${card} sm:col-span-2`}>
        <h3 className="mb-2 text-xl font-semibold">Time tracked per member (7 days)</h3>
        <TimeTrackedChart data={timeByMember} />
      </div>
    </>
  );
}

export default DashboardMetrics;
