import { Metadata } from "next";
import GoalsHome from "@/features/goals/components/GoalsHome";

export const metadata: Metadata = {
  title: "Goals",
};

function GoalsPage() {
  return <GoalsHome />;
}

export default GoalsPage;
