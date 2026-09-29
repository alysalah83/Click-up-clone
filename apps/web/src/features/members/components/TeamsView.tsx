"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { Menu, MenuContent, MenuTrigger, useMenu } from "@/shared/ui/Menu/MenuCompound";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import { cn } from "@/shared/lib/utils/cn";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { removeMemberAction, updateMemberRoleAction } from "../actions/members.actions";
import { usePeople } from "../hooks/useMembers";
import { displayName } from "../lib/avatar";
import type { MemberRole, Person } from "../types";
import InvitePanel from "./InvitePanel";
import { UserAvatar } from "./UserAvatar";

const ROLE_STYLES: Record<MemberRole, string> = {
  owner: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  admin: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  member: "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300",
  guest: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};
const ASSIGNABLE_ROLES = ["admin", "member", "guest"] as const;

const canManage = (role: MemberRole | undefined) => role === "owner" || role === "admin";

function RoleBadge({ role, space }: { role: MemberRole; space?: string }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium capitalize", ROLE_STYLES[role])}>
      {space && <span className="font-normal opacity-80">{space} · </span>}
      {role}
    </span>
  );
}

function RoleMenu({
  workspaceId,
  person,
  current,
}: {
  workspaceId: string;
  person: Person;
  current: MemberRole;
}) {
  const { toggleMenu } = useMenu();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const run = (action: () => ReturnType<typeof updateMemberRoleAction>) =>
    startTransition(async () => {
      const response = await action();
      if (response.status === "error") window.toast?.error(formatErrorForToast(response.error), 7);
      await queryClient.invalidateQueries({ queryKey: ["members"] });
      toggleMenu();
    });

  return (
    <menu className={cn("flex min-w-40 flex-col p-1.5", isPending && "pointer-events-none opacity-60")}>
      {ASSIGNABLE_ROLES.map((role) => (
        <li key={role}>
          <button
            type="button"
            onClick={() => run(() => updateMemberRoleAction(workspaceId, person.id, role))}
            className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm capitalize hover:bg-neutral-600/20 dark:hover:bg-neutral-500/20"
          >
            {role}
            {role === current && <ICONS_MAP.checkMark className="size-4 text-violet-500" />}
          </button>
        </li>
      ))}
      <li className="mt-1 border-t border-neutral-200 pt-1 dark:border-neutral-700">
        <button
          type="button"
          onClick={() => run(() => removeMemberAction(workspaceId, person.id))}
          className="w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-red-500 hover:bg-red-500/10"
        >
          Remove from space
        </button>
      </li>
    </menu>
  );
}

function PersonRow({ person, myRoles }: { person: Person; myRoles: Map<string, MemberRole> }) {
  return (
    <tr className="border-b border-neutral-200 text-sm last:border-b-0 dark:border-neutral-800">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <UserAvatar user={person} size="md" />
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 truncate font-medium text-neutral-800 dark:text-neutral-100">
              {displayName(person)}
              {person.isMe && <span className="text-xs font-normal text-neutral-500">(you)</span>}
            </span>
            <span className="truncate text-xs text-neutral-500 sm:hidden">
              {person.email ?? (person.isDemo ? "Demo teammate" : "Guest")}
            </span>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-2.5 text-neutral-500 sm:table-cell">
        {person.email ?? (person.isDemo ? "Demo teammate" : "Guest account")}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1.5">
          {person.workspaces.map((space) => {
            const editable = !person.isMe && space.role !== "owner" && canManage(myRoles.get(space.id));
            const badge = <RoleBadge role={space.role} space={space.name} />;
            if (!editable) return <span key={space.id}>{badge}</span>;
            return (
              <Menu key={space.id}>
                <MenuTrigger>
                  <button
                    type="button"
                    aria-label={`change role in ${space.name}`}
                    className="flex cursor-pointer items-center gap-0.5 rounded hover:opacity-80"
                  >
                    {badge}
                    <ICONS_MAP.rightArrow2 className="size-3.5 rotate-90 text-neutral-500" />
                  </button>
                </MenuTrigger>
                <MenuContent>
                  <RoleMenu workspaceId={space.id} person={person} current={space.role} />
                </MenuContent>
              </Menu>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-2.5 text-right text-neutral-600 tabular-nums dark:text-neutral-300">
        {person.assignedTasksCount}
      </td>
    </tr>
  );
}

/** The Teams page: everyone in my spaces, their roles, and invites. */
function TeamsView() {
  const { people, isPending, error } = usePeople();

  const me = people?.find((p) => p.isMe);
  const myRoles = new Map(me?.workspaces.map((w) => [w.id, w.role]) ?? []);
  const invitable = me?.workspaces.filter((w) => canManage(w.role)) ?? [];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 p-3 sm:p-4 lg:p-8">
      <header className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-violet-500 text-white">
          <ICONS_MAP.team className="size-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Teams</h1>
          <p className="text-sm text-neutral-500">
            {people ? `${people.length} people across your spaces` : "People across your spaces"}
          </p>
        </div>
      </header>

      {!isPending && <InvitePanel workspaces={invitable} />}

      <section className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
        <table className="w-full min-w-[520px] text-left">
          <thead className="bg-neutral-100/80 text-xs font-semibold text-neutral-500 uppercase dark:bg-neutral-800/50">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="hidden px-3 py-2 sm:table-cell">Email</th>
              <th className="px-3 py-2">Spaces &amp; role</th>
              <th className="px-3 py-2 text-right">Assigned tasks</th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr>
                <td colSpan={4} className="p-3">
                  <SkeletonLoader height="h-10" width="w-full" count={5} />
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={4} className="p-4 text-sm text-red-500">
                  Could not load members.
                </td>
              </tr>
            )}
            {people?.map((person) => <PersonRow key={person.id} person={person} myRoles={myRoles} />)}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default TeamsView;
