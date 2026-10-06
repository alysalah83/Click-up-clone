import { Metadata } from "next";
import GoalDetail from "@/features/goals/components/GoalDetail";

export const metadata: Metadata = {
  title: "Goal",
};

async function GoalPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params;
  return <GoalDetail goalId={goalId} />;
}

export default GoalPage;
