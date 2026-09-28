"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import BoardSkeleton from "../views/Board/components/BoardSkeleton";
import TableSkeleton from "../views/Table/TableSkeleton";
import ListSkeleton from "../views/List/ListSkeleton";
import SpinnerLoader from "@/shared/ui/SpinnerLoader";

export default function TasksLoadingSkeleton() {
  const segment = useSelectedLayoutSegment();

  if (segment === "board") return <BoardSkeleton columnCount={4} />;
  if (segment === "table") return <TableSkeleton />;
  if (segment === "list") return <ListSkeleton />;

  return <SpinnerLoader />;
}
