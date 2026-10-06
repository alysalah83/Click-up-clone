"use client";

import { useState } from "react";
import { CheckCircle2, Flag } from "lucide-react";
import { FORM_PRIORITIES, validateAnswers } from "../lib";
import type { FormAnswers, PublicForm, PublicFormField } from "../types";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-xs outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-500/20 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100";

const PRIORITY_STYLE: Record<(typeof FORM_PRIORITIES)[number], string> = {
  urgent: "text-red-600",
  high: "text-amber-500",
  normal: "text-blue-500",
  low: "text-neutral-400",
};

function FieldInput({
  field,
  value,
  invalid,
  onChange,
}: {
  field: PublicFormField;
  value: string | boolean | undefined;
  invalid: boolean;
  onChange: (value: string | boolean) => void;
}) {
  const id = `form-field-${field.id}`;
  const common = { id, "aria-invalid": invalid || undefined, "aria-required": field.required || undefined };
  const text = typeof value === "string" ? value : "";

  switch (field.type) {
    case "long_text":
      return (
        <textarea
          {...common}
          rows={4}
          className={`${inputClass} resize-y`}
          placeholder={field.placeholder}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "dropdown":
      return (
        <select
          {...common}
          className={`${inputClass} ${text ? "" : "text-neutral-400"}`}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{field.placeholder || "Select an option"}</option>
          {field.options.map((option) => (
            <option key={option} value={option} className="text-neutral-900">
              {option}
            </option>
          ))}
        </select>
      );
    case "priority":
      return (
        <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
          {FORM_PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={text === p}
              onClick={() => onChange(text === p ? "" : p)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm capitalize transition ${
                text === p
                  ? "border-violet-500 bg-violet-50 text-violet-900 dark:bg-violet-500/15 dark:text-violet-100"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              <Flag className={`size-3.5 fill-current ${PRIORITY_STYLE[p]}`} />
              {p}
            </button>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            {...common}
            type="checkbox"
            className="size-4 accent-violet-600"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.placeholder || "Yes"}
        </label>
      );
    default:
      return (
        <input
          {...common}
          type={field.type === "short_text" ? "text" : field.type}
          inputMode={field.type === "number" ? "decimal" : undefined}
          className={inputClass}
          placeholder={field.placeholder}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/**
 * The form as respondents see it: a brand header, the fields with client-side validation, a hidden
 * honeypot and a success screen. In "preview" mode (the builder) nothing is sent.
 */
function FormCard({
  form,
  mode,
  onSubmit,
}: {
  form: Pick<PublicForm, "title" | "description" | "fields">;
  mode: "live" | "preview";
  /** Live mode: sends the answers; throws an Error (message shown) or { fieldErrors }. */
  onSubmit?: (answers: FormAnswers, honeypot: string) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<FormAnswers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [problem, setProblem] = useState("");

  const set = (id: string, value: string | boolean) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    if (errors[id]) setErrors(({ [id]: _removed, ...rest }) => rest);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProblem("");
    const found = validateAnswers(form.fields, answers);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`form-field-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    if (mode === "preview" || !onSubmit) return setStatus("done");
    setStatus("sending");
    try {
      await onSubmit(answers, honeypot);
      setStatus("done");
    } catch (error) {
      setStatus("idle");
      const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
      if (fieldErrors) setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0] ?? "Invalid"])));
      setProblem(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };

  const reset = () => {
    setAnswers({});
    setErrors({});
    setStatus("idle");
  };

  return (
    <article className="w-full overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
      <div className="relative h-20 bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 sm:h-24">
        <span className="absolute bottom-3 left-6 text-sm font-extrabold tracking-tight text-white/90 sm:left-8">Click Up</span>
      </div>
      {status === "done" ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center sm:px-8">
          <CheckCircle2 className="size-12 text-emerald-500" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Thanks! Your response was submitted.</h2>
          {mode === "preview" && <p className="text-sm text-neutral-500">This is a preview, so nothing was saved.</p>}
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Submit another response
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="flex flex-col gap-5 px-6 py-6 sm:px-8 sm:py-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold break-words text-neutral-900 dark:text-neutral-50">{form.title || "Untitled form"}</h1>
            {form.description && (
              <p className="text-sm whitespace-pre-line text-neutral-600 dark:text-neutral-400">{form.description}</p>
            )}
          </header>
          {form.fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              {field.type !== "checkbox" || field.label ? (
                <label
                  id={`form-field-${field.id}-label`}
                  htmlFor={`form-field-${field.id}`}
                  className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  {field.label || "Untitled field"}
                  {field.required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
              ) : null}
              <FieldInput field={field} value={answers[field.id]} invalid={!!errors[field.id]} onChange={(v) => set(field.id, v)} />
              {errors[field.id] && <p className="text-xs text-red-600 dark:text-red-400">{errors[field.id]}</p>}
            </div>
          ))}
          {/* Honeypot: hidden from people and screen readers; bots that fill every input get dropped. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>
          </div>
          {problem && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{problem}</p>}
          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-1 self-start rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
          >
            {status === "sending" ? "Submitting…" : "Submit"}
          </button>
        </form>
      )}
    </article>
  );
}

export default FormCard;
