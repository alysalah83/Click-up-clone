"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/Button";
import ErrorMessage from "@/shared/ui/ErrorMessage/ErrorMessage";
import { acceptInviteAction } from "../actions/accept-invite.action";

/** Logged in: joins. Logged out: continues as a new guest, then joins. Either way it redirects. */
function AcceptInviteButton({ token, isLoggedIn }: { token: string; isLoggedIn: boolean }) {
  const [state, action, isPending] = useActionState(() => acceptInviteAction(token), null);

  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <Button ariaLabel="accept invite" size="large" stretch pending={isPending}>
        {isLoggedIn ? "Join workspace" : "Continue as Guest"}
      </Button>
      <ErrorMessage error={state?.status === "error" ? state.error.message : undefined} />
      {!isLoggedIn && (
        <p className="text-center text-xs text-neutral-500">
          A guest account is created for you. Tip: open invite links in an incognito window to act
          as a second user.
        </p>
      )}
    </form>
  );
}

export default AcceptInviteButton;
