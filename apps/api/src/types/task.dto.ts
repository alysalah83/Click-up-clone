interface TasksFilterQueryDTO {
  status?: "asc" | "desc";
  priority?: "asc" | "desc";
  dueDate?: "asc" | "desc";
  createdAt?: "asc" | "desc";
}

type Orders = "asc" | "desc";

export type { TasksFilterQueryDTO, Orders };
