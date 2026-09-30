import { getDashboardSummary } from "@/features/dashboard/api";
import DashboardStatusPieChart from "./DashboardStatusPieChart";

// Grouped by status category (not by name): per-list custom names would give ~15 slices.
const CATEGORIES = [
  { key: "open", name: "Not started", fill: "#a3a3a3" },
  { key: "active", name: "In progress", fill: "#6366f1" },
  { key: "done", name: "Done", fill: "#10b981" },
] as const;

async function DashboardStatusPie() {
  const { categories } = await getDashboardSummary();
  const statusesData = CATEGORIES.map(({ key, name, fill }) => ({
    name,
    value: categories[key],
    fill,
  })).filter((d) => d.value > 0);

  return (
    <>
      <h2 className="text-xl font-semibold">Workload by Status</h2>
      <div className="flex h-64 w-full items-center">
        <DashboardStatusPieChart data={statusesData} />
      </div>
    </>
  );
}

export default DashboardStatusPie;
