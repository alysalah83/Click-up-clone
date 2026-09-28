import Body from "./Body";
import TableAddTaskRow from "../../components/AddTaskRow/AddTaskRow";
import CheckTaskProvider from "../../context/CheckTaskProvider";
import Header from "./Header";
import ActionsRow from "../../components/ActionsRow";

function TableTasksLayout() {
  return (
    <section className="w-full overflow-x-auto">
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
