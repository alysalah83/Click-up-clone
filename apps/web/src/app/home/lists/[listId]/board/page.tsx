import { BoardColumns } from "@/features/task/views/Board/components";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Board",
};

function BoardPage() {
  return <BoardColumns />;
}

export default BoardPage;
