import DashboardStatusCards from "@/features/status/components/DashboardStatusCards";
import DashboardStatusPie from "@/features/status/components/DashboardStatusPie";
import DashboardPriorityPie from "@/features/task/views/Dashboard/DashboardPriorityPie";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

function DashboardPage() {
  return (
    <main className="p-3 sm:p-4 lg:p-8">
      <main className="grid grid-cols-1 gap-6 text-neutral-600 lg:grid-cols-2 dark:text-neutral-400">
        <section className="col-span-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DashboardStatusCards />
        </section>
        <section className="rounded-xl border border-neutral-200 bg-neutral-200 p-4 dark:border-neutral-600 dark:bg-neutral-900">
          <DashboardStatusPie />
        </section>
        <section className="col-span-1 rounded-xl border border-neutral-200 bg-neutral-200 p-4 dark:border-neutral-600 dark:bg-neutral-900">
          <DashboardPriorityPie />
        </section>
      </main>
    </main>
  );
}

export default DashboardPage;
