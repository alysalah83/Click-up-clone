"use client";

import LogAndSignLayout from "./LogAndSignLayout";
import { startTransition, useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import ErrorMessage from "@/shared/ui/ErrorMessage/ErrorMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/features/auth/schema/authSchemas";
import { loginUser } from "../actions/login-user.action";
import FormInputWithLabel from "@/shared/ui/Input/FormInputWithLabel";
import { Button } from "@/shared/ui/Button";
import SignupGuestBtn from "./SignupGuestBtn";
import { ErrorResponse } from "@/shared/types/action.types";

interface FormData {
  email: string;
  password: string;
}

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ mode: "onBlur", resolver: zodResolver(loginSchema) });
  const [state, action, isPending] = useActionState(loginUser, null);

  const onSubmit = function (data: FormData) {
    startTransition(() => {
      action({
        email: data.email,
        password: data.password,
      });
    });
  };

  return (
    <LogAndSignLayout page="login">
      <div className="flex flex-col gap-5">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          <FormInputWithLabel
            icon="mail"
            label="Email"
            placeholder="Enter your email"
            inputType="email"
            errorMessage={errors.email?.message}
            disabled={isPending}
            register={register("email")}
            autoComplete="email"
          />
          <FormInputWithLabel
            icon="lock"
            label="Password"
            placeholder="Enter password"
            inputType="password"
            errorMessage={errors.password?.message}
            disabled={isPending}
            register={register("password")}
            autoComplete="current-password"
          />

          <Button
            type="colored"
            stretch={true}
            size="large"
            rounded="large"
            ariaLabel="login button"
            extraClasses="mt-1 shadow-md shadow-indigo-500/25"
            disabled={isPending}
            pending={isPending}
            pendingSpinnerWidth="medium"
          >
            Login
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

export default LoginForm;
