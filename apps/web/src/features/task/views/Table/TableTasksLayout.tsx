import Body from "./Body";
import TableAddTaskRow from "../../components/AddTaskRow/AddTaskRow";
import CheckTaskProvider from "../../context/CheckTaskProvider";
import Header from "./Header";
import ActionsRow from "../../components/ActionsRow";
import { ViewToolbar } from "@/features/viewConfig/components/ViewToolbar";

function TableTasksLayout() {
  return (
    <section className="w-full overflow-x-auto">
      <ViewToolbar />
      <div className="min-w-3xl">
        <CheckTaskProvider>
          <Header />
          <Body />
          <ActionsRow />
        </CheckTaskProvider>

        <TableAddTaskRow styleFor="table" />
      </div>
    </section>
  );
}

export default TableTasksLayout;
