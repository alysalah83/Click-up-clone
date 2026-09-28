"use client";

import LogAndSignLayout from "./LogAndSignLayout";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import ErrorMessage from "@/shared/ui/ErrorMessage/ErrorMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupUserSchema } from "@/features/auth/schema/authSchemas";
import { signupUser } from "../actions/signup-user.action";
import FormInputWithLabel from "@/shared/ui/Input/FormInputWithLabel";
import { Button } from "@/shared/ui/Button";
import SignupGuestBtn from "./SignupGuestBtn";
import { ErrorResponse } from "@/shared/types/action.types";

interface FormData {
  name: string;
  email: string;
  password: string;
}

function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onBlur",
    resolver: zodResolver(signupUserSchema),
  });
  const [state, action, isPending] = useActionState(signupUser, null);

  const onSubmit = function (data: FormData) {
    startTransition(() => {
      action({
        name: data.name,
        email: data.email,
        password: data.password,
      });
    });
  };

  return (
    <LogAndSignLayout page="signup">
      <div className="flex flex-col gap-5">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <FormInputWithLabel
            icon="user"
            label="Full Name"
            placeholder="Aly Salah"
            inputType="text"
            errorMessage={errors.name?.message}
            disabled={isPending}
            register={register("name")}
            autoComplete="name"
          />
          <FormInputWithLabel
            icon="mail"
            label="Email"
            placeholder="email@example.com"
            inputType="email"
            errorMessage={errors.email?.message}
            disabled={isPending}
            register={register("email")}
            autoComplete="email"
          />
          <FormInputWithLabel
            icon="lock"
            label="Choose Password"
            placeholder="Minimum 8 charter"
            inputType="password"
            errorMessage={errors.password?.message}
            disabled={isPending}
            register={register("password")}
            autoComplete="new-password"
          />

          <Button
            type="colored"
            stretch={true}
            size="large"
            rounded="large"
            ariaLabel="create account button"
            extraClasses="mt-1 shadow-md shadow-indigo-500/25"
            disabled={isPending}
            pending={isPending}
            pendingSpinnerWidth="medium"
          >
            Create account
          </Button>
          {state?.error && (
            <ErrorMessage
              error={state.error.message}
              errorObject={state.error.errors}
            />
          )}
        </form>
        <div className="flex items-center gap-4">
          <span className="grow border-t border-gray-100" />
          <p className="text-sm font-semibold text-gray-400">or</p>
          <span className="grow border-t border-gray-100" />
        </div>
        <SignupGuestBtn stretch={true} />
      </div>
    </LogAndSignLayout>
  );
}

export default SignupForm;
