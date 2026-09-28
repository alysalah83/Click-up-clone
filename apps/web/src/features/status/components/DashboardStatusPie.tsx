import { statusServices } from "../services/status.service";
import DashboardStatusPieChart from "./DashboardStatusPieChart";

async function DashboardStatusPie() {
  const statusesSummery = await statusServices.getStatusesCountsSummery();

  const statusesData = Object.entries(statusesSummery)
    .filter(([key]) => !key.toLocaleLowerCase().includes("total"))
    .map(([key, value]) => ({
      name: key.toLocaleLowerCase().replace("count", ""),
      value,
    }));

  return (
    <>
      <h2 className="text-xl font-semibold">Workload by Status</h2>
      <div className="text- flex h-64 w-full items-center">
        <DashboardStatusPieChart data={statusesData} />
      </div>
    </>
  );
}

export default DashboardStatusPie;
