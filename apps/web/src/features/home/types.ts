export type MyWorkBucket = "overdue" | "today" | "upcoming" | "nodate";

export type MyWorkTask = {
  id: string;
  name: string;
  priority: "urgent" | "high" | "normal" | "low" | "none";
  startDate: string | null;
  dueDate: string | null;
  bucket: MyWorkBucket;
  status: { id: string; name: string; type: "open" | "active" | "done"; icon: string; iconColor: string; bgColor: string };
  list: { id: string; name: string; workspaceId: string; workspaceName: string };
};
