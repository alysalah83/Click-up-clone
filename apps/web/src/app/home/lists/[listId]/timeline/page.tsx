import TimelineView from "@/features/task/views/Timeline/components/TimelineView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline",
};

function TimelinePage() {
  return <TimelineView />;
}

export default TimelinePage;
