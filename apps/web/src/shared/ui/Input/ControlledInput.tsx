"use client";

import { ChangeEventHandler, FocusEventHandler } from "react";
import ErrorMessage from "../ErrorMessage/ErrorMessage";
import clsx from "clsx";

interface ControlledInputProps {
  name: string;
  placeholder?: string;
  type?: HTMLInputElement["type"];
  inputStyle?: "primary" | "secondary";
  disabled?: boolean;
  labelText?: string;
  errorMessage?: string;
  value: string | number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}

function ControlledInput({
  type = "text",
  name,
  inputStyle = "primary",
  errorMessage,
  labelText,
  disabled,
  placeholder,
  value,
  onChange,
  onBlur,
}: ControlledInputProps) {
  const inputClasses = clsx(
    "w-full rounded-lg transition duration-300 disabled:cursor-not-allowed outline-none",
    {
      "px-4 py-2 border border-neutral-500 ring-offset-1 ring-offset-neutral-100 placeholder-neutral-500 focus:ring disabled:bg-neutral-600 disabled:text-neutral-100 dark:border-neutral-700 dark:ring-offset-neutral-500 dark:disabled:bg-neutral-500 dark:disabled:text-neutral-800":
        inputStyle === "primary",
      "p-1 text-sm text-neutral-900 outline-0 dark:text-neutral-100 placeholder:text-neutral-400 disabled:opacity-50":
        inputStyle === "secondary",
    },
  );

  return (
    <div className="flex w-full flex-col gap-1">
      {labelText && <label className="text-sm font-medium">{labelText}</label>}
      <input
        name={name}
        id={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
      />
      <ErrorMessage error={errorMessage} />
    </div>
  );
}

export default ControlledInput;
