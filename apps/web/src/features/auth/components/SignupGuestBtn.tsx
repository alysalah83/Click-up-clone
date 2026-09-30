"use client";

import { Button } from "@/shared/ui/Button";
import { signupGuest } from "../actions/signup-guest.action";
import { startTransition, useActionState } from "react";

function SignupGuestBtn({
  stretch = false,
  label = "Continue as Guest",
  type = "secondary",
  extraClasses = "",
}: {
  stretch?: boolean;
  label?: string;
  type?: "primary" | "secondary" | "colored";
  extraClasses?: string;
}) {
  const [_, action, isPending] = useActionState(signupGuest, null);

  return (
    <Button
      onClick={() => {
        startTransition(() => {
          action();
        });
      }}
      type={type}
      size="large"
      stretch={stretch}
      extraClasses={extraClasses}
      pending={isPending}
      ariaLabel="signup as guest button"
    >
      {label}
    </Button>
  );
}

export default SignupGuestBtn;
