import type { Status } from "../types";

export const findOpenStatus = (statuses: Status[] | undefined) =>
  statuses?.find((status) => status.type === "open") ??
  [...(statuses ?? [])].sort((a, b) => a.order - b.order)[0];

export const findDoneStatus = (statuses: Status[] | undefined) =>
  statuses?.find((status) => status.type === "done");

export const isDoneStatus = (status: Pick<Status, "type">) =>
  status.type === "done";
