import type { SprintState } from "@/features/list/types";

interface SprintSummary {
  id: string;
  name: string;
  workspaceId: string;
  sprintNumber: number;
  sprintStart: string;
  sprintEnd: string;
  sprintState: SprintState;
  totalPoints: number;
  donePoints: number;
  unfinishedPoints: number;
  taskCount: number;
  doneCount: number;
  unfinishedCount: number;
  nextSprint: { id: string; name: string; sprintNumber: number } | null;
}

interface SprintReport {
  sprint: Pick<SprintSummary, "id" | "name" | "sprintNumber" | "sprintStart" | "sprintEnd" | "sprintState">;
  burndown: {
    unit: "points" | "tasks";
    total: number;
    carriedOutCount: number;
    points: { date: string; ideal: number; remaining: number | null }[];
  };
  velocity: {
    sprints: { id: string; name: string; committed: number; completed: number }[];
    average: number;
  };
}

export type { SprintSummary, SprintReport };
