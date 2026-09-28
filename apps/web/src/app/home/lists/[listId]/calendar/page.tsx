import CalendarLayout from "@/features/task/views/Calendar/components/CalendarLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar",
};

function CalendarPage() {
  return <CalendarLayout />;
}

export default CalendarPage;
