import WorkloadView from "@/features/task/views/Workload/components/WorkloadView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workload",
};

function WorkloadPage() {
  return <WorkloadView />;
}

export default WorkloadPage;
