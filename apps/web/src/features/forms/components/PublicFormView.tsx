"use client";

import FormCard from "./FormCard";
import { toSubmission } from "../lib";
import type { FormAnswers, PublicForm } from "../types";

type ErrorBody = { error?: { message?: string; errors?: { fieldErrors?: Record<string, string[]> } } };

/** The live public form: posts to the web proxy, which forwards to the API without cookies. */
function PublicFormView({ form }: { form: PublicForm }) {
  const send = async (answers: FormAnswers, honeypot: string) => {
    const res = await fetch(`/api/public/forms/${encodeURIComponent(form.slug)}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: toSubmission(form.fields, answers), ...(honeypot && { website: honeypot }) }),
    });
    if (res.ok) return;
    const body = (await res.json().catch(() => ({}))) as ErrorBody;
    const message =
      res.status === 429
        ? "Too many responses in a short time. Please wait a minute and try again."
        : res.status === 404
          ? "This form is no longer accepting responses."
          : body.error?.message || "Something went wrong. Please try again.";
    throw Object.assign(new Error(message), { fieldErrors: body.error?.errors?.fieldErrors });
  };

  return <FormCard form={form} mode="live" onSubmit={send} />;
}

export default PublicFormView;
