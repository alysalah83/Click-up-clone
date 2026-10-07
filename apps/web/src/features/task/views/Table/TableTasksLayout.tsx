"use client";

import Body from "./Body";
import TableAddTaskRow from "../../components/AddTaskRow/AddTaskRow";
import CheckTaskProvider from "../../context/CheckTaskProvider";
import Header from "./Header";
import ActionsRow from "../../components/ActionsRow";
import { ViewToolbar } from "@/features/viewConfig/components/ViewToolbar";
import { useCustomFields } from "@/features/customFields/hooks";
import { useTasksQueryKey } from "../../hooks/useTasksQueryKey";
import { tableGridStyle } from "./table.styles";

function TableTasksLayout() {
  const { listId } = useTasksQueryKey();
  const { fields } = useCustomFields(listId);
  return (
    <section className="w-full overflow-x-auto">
      <ViewToolbar />
      <div style={tableGridStyle(fields?.length ?? 0)}>
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
