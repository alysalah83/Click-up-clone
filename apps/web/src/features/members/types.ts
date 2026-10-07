type MemberRole = "owner" | "admin" | "member" | "guest";

/** The user shape embedded in task payloads (`task.assignees`). */
interface Assignee {
  id: string;
  name: string | null;
  email?: string | null;
  avatarColor: string | null;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  role: MemberRole;
  name: string | null;
  email: string | null;
  avatarColor: string | null;
  isDemo: boolean;
  /** Workload capacity per day (null = the view's default). */
  capacityTasks?: number | null;
  capacityPoints?: number | null;
  createdAt: string;
}

/** A row of the Teams page: one person across all my workspaces. */
interface Person {
  id: string;
  name: string | null;
  email: string | null;
  avatarColor: string | null;
  isDemo: boolean;
  isMe: boolean;
  assignedTasksCount: number;
  workspaces: { id: string; name: string; role: MemberRole }[];
}

interface Invite {
  token: string;
  url: string;
  role: MemberRole;
  expiresAt: string;
}

interface InvitePreview {
  workspace: { id: string; name: string; avatar: { icon: string; color: string } };
  inviter: { name: string };
  role: MemberRole;
  expiresAt: string;
}

export type { MemberRole, Assignee, WorkspaceMember, Person, Invite, InvitePreview };
