import SprintReport from "@/features/sprint/components/SprintReport";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sprint report",
};

function SprintReportPage() {
  return <SprintReport />;
}

export default SprintReportPage;
