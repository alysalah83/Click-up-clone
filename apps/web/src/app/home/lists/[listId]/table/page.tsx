import { Metadata } from "next";
import TableTasksLayout from "@/features/task/views/Table/TableTasksLayout";

export const metadata: Metadata = {
  title: "Table",
};

function page() {
  return <TableTasksLayout />;
}

export default page;
