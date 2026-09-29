import { memo } from "react";
import { cn } from "@/shared/lib/utils/cn";
import { avatarColor, displayName, initials } from "../lib/avatar";
import type { Assignee } from "../types";

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
} as const;

type AvatarSize = keyof typeof SIZES;

interface UserAvatarProps {
  user: Assignee;
  size?: AvatarSize;
  className?: string;
}

/** Initials on a colored circle (ClickUp style). */
function UserAvatarBase({ user, size = "sm", className }: UserAvatarProps) {
  return (
    <span
      title={displayName(user)}
      aria-label={displayName(user)}
      style={{ backgroundColor: avatarColor(user) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-neutral-100 select-none dark:ring-neutral-900",
        SIZES[size],
        className,
      )}
    >
      {initials(user)}
    </span>
  );
}

export const UserAvatar = memo(UserAvatarBase);

interface AvatarStackProps {
  users: Assignee[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

/** Overlapping avatars, with a "+N" bubble past `max`. */
function AvatarStackBase({ users, max = 3, size = "sm", className }: AvatarStackProps) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;

  return (
    <span className={cn("flex items-center -space-x-1.5", className)}>
      {shown.map((user) => (
        <UserAvatar key={user.id} user={user} size={size} />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-neutral-300 font-semibold text-neutral-700 ring-2 ring-neutral-100 dark:bg-neutral-700 dark:text-neutral-200 dark:ring-neutral-900",
            SIZES[size],
          )}
          title={users
            .slice(max)
            .map((u) => displayName(u))
            .join(", ")}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}

export const AvatarStack = memo(AvatarStackBase);
