import { Metadata } from "next";
import TeamsView from "@/features/members/components/TeamsView";

export const metadata: Metadata = {
  title: "Teams",
};

function TeamsPage() {
  return <TeamsView />;
}

export default TeamsPage;
