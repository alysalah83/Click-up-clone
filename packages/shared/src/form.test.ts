import { describe, expect, it } from "vitest";
import {
  DEFAULT_FORM_FIELDS,
  formFieldsSchema,
  formSubmissionTask,
  priorityFromAnswer,
  validateFormAnswers,
  type FormField,
} from "./form.js";

const field = (f: Partial<FormField> & Pick<FormField, "id" | "type">): FormField => ({
  label: f.id,
  placeholder: "",
  required: false,
  options: [],
  mapTo: "description",
  ...f,
});

const BUG_FIELDS: FormField[] = [
  field({ id: "summary", type: "short_text", label: "Summary", mapTo: "name" }),
  field({ id: "steps", type: "long_text", label: "Steps to reproduce" }),
  field({ id: "severity", type: "dropdown", label: "Severity", options: ["Low", "Medium", "High", "Critical"], mapTo: "priority", required: true }),
  field({ id: "email", type: "email", label: "Your email" }),
  field({ id: "due", type: "date", label: "Needed by", mapTo: "due_date" }),
  field({ id: "count", type: "number", label: "Users affected" }),
  field({ id: "agree", type: "checkbox", label: "Can we contact you?" }),
];

describe("formFieldsSchema", () => {
  it("accepts the default fields and fills field defaults", () => {
    expect(formFieldsSchema.parse(DEFAULT_FORM_FIELDS)).toEqual(DEFAULT_FORM_FIELDS);
    expect(formFieldsSchema.parse([{ id: "a", type: "short_text", label: " A ", mapTo: "name" }])).toEqual([
      { id: "a", type: "short_text", label: "A", placeholder: "", required: false, options: [], mapTo: "name" },
    ]);
  });

  it("needs exactly one name field, compatible mappings, options and unique ids", () => {
    const name = { id: "a", type: "short_text", label: "A", mapTo: "name" } as const;
    expect(formFieldsSchema.safeParse([{ ...name, mapTo: "description" }]).success).toBe(false);
    expect(formFieldsSchema.safeParse([name, { ...name, id: "b" }]).success).toBe(false);
    expect(formFieldsSchema.safeParse([name, { id: "a", type: "long_text", label: "B" }]).success).toBe(false);
    expect(formFieldsSchema.safeParse([name, { id: "d", type: "number", label: "D", mapTo: "due_date" }]).success).toBe(false);
    expect(formFieldsSchema.safeParse([name, { id: "d", type: "dropdown", label: "D" }]).success).toBe(false);
    expect(formFieldsSchema.safeParse([name, { id: "d", type: "dropdown", label: "D", options: ["x"], mapTo: "priority" }]).success).toBe(true);
  });
});

describe("validateFormAnswers", () => {
  it("normalizes values and reports each invalid field", () => {
    const { values, errors } = validateFormAnswers(BUG_FIELDS, {
      summary: "  Crash on save ",
      severity: "Huge",
      email: "nope",
      due: "2026-02-30",
      count: "12",
      extra: "ignored",
    });
    expect(errors).toEqual({
      severity: "Pick one of the options",
      email: "Enter a valid email address",
      due: "Enter a valid date",
    });
    expect(values).toMatchObject({ summary: "Crash on save", steps: null, count: 12, agree: false });
    expect(values).not.toHaveProperty("extra");
  });

  it("requires required fields and the name field", () => {
    expect(validateFormAnswers(BUG_FIELDS, {}).errors).toEqual({
      summary: "This field is required",
      severity: "This field is required",
    });
    const checkbox = [field({ id: "n", type: "short_text", mapTo: "name" }), field({ id: "ok", type: "checkbox", required: true })];
    expect(validateFormAnswers(checkbox, { n: "x", ok: false }).errors).toEqual({ ok: "This field is required" });
    expect(validateFormAnswers(checkbox, { n: "x", ok: true }).errors).toEqual({});
  });
});

describe("formSubmissionTask", () => {
  it("maps the name, priority and due date, and lists the answers in the description", () => {
    const { values, errors } = validateFormAnswers(BUG_FIELDS, {
      summary: "Crash on save",
      steps: "Open a task\nClick save",
      severity: "Critical",
      email: "ana@example.com",
      due: "2026-11-02",
      agree: true,
    });
    expect(errors).toEqual({});
    const task = formSubmissionTask({ title: "Report a bug", fields: BUG_FIELDS }, values);
    expect(task.name).toBe("Crash on save");
    expect(task.priority).toBe("urgent");
    expect(task.endDate?.toISOString()).toBe("2026-11-02T12:00:00.000Z");
    const [intro, list] = task.description.content as { type: string; content: { content: unknown[] }[] }[];
    expect(JSON.stringify(intro)).toContain("Report a bug");
    expect(list!.type).toBe("bulletList");
    // steps (multi-line), severity, email, due, agree; empty "count" is skipped.
    expect(list!.content).toHaveLength(5);
    expect(list!.content[0]!.content).toHaveLength(3);
    expect(JSON.stringify(list)).toContain("Your email: ");
    expect(JSON.stringify(list)).toContain('"text":"Yes"');
  });

  it("falls back to the form title and cuts long names", () => {
    const fields = [field({ id: "n", type: "long_text", mapTo: "name" })];
    expect(formSubmissionTask({ title: "Feedback", fields }, { n: null }).name).toBe("Feedback");
    expect(formSubmissionTask({ title: "F", fields }, { n: "x".repeat(300) }).name).toHaveLength(128);
  });
});

describe("priorityFromAnswer", () => {
  it("reads common severity words", () => {
    expect(["Critical", "High", "Medium", "Low", "Whatever"].map(priorityFromAnswer)).toEqual([
      "urgent",
      "high",
      "normal",
      "low",
      "none",
    ]);
  });
});
