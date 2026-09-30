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
    "w-full rounded-lg transition duration-200 disabled:cursor-not-allowed outline-none bg-transparent",
    {
      "px-3.5 py-2 border border-neutral-300 shadow-xs placeholder-neutral-400 focus:border-ring focus:ring-4 focus:ring-ring/20 disabled:bg-neutral-200 disabled:text-neutral-500 dark:border-neutral-700 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-400":
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
