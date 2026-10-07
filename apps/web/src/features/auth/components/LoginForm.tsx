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
        <SignupGuestBtn
          stretch
          label="Continue as guest (demo workspace)"
          extraClasses="!normal-case !rounded-lg !py-3 !text-[15px] !font-semibold !bg-white !border-[#d9d9e3] !text-[#1f1f2e] hover:!bg-[#f7f7fa] !shadow-none"
        />
        <div className="flex items-center gap-3">
          <span className="grow border-t border-[#ececf2]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9a9aab]">
            or
          </p>
          <span className="grow border-t border-[#ececf2]" />
        </div>
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
            extraClasses="mt-1 !normal-case !rounded-lg !py-3 !bg-[#7b68ee] hover:!bg-[#6a57e3] !shadow-none"
            disabled={isPending}
            pending={isPending}
            pendingSpinnerWidth="medium"
          >
            Log in
          </Button>

          {state?.error && (
            <ErrorMessage
              error={state.error.message}
              errorObject={state.error.errors}
            />
          )}
        </form>
      </div>
    </LogAndSignLayout>
  );
}

export default LoginForm;
