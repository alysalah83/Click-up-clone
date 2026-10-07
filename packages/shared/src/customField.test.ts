import { describe, expect, it } from "vitest";
import {
  computeFormula,
  evaluateFormula,
  parseCustomFieldValue,
  parseFormula,
  validateFormula,
  type CustomField,
} from "./customField.js";
import { savedViewConfigSchema } from "./savedView.js";

const vars: Record<string, number | null> = { points: 3, "Estimate (h)": 5, Actual: 2, Empty: null };
const run = (expr: string) => evaluateFormula(expr, (name) => vars[name]);

describe("evaluateFormula", () => {
  it("computes arithmetic with precedence, parentheses and unary minus", () => {
    expect(run("1 + 2 * 3")).toEqual({ ok: true, value: 7 });
    expect(run("(1 + 2) * 3")).toEqual({ ok: true, value: 9 });
    expect(run("-2 * -(3 - 1)")).toEqual({ ok: true, value: 4 });
    expect(run("10 / 4")).toEqual({ ok: true, value: 2.5 });
    expect(run("8 - 2 - 1")).toEqual({ ok: true, value: 5 });
    expect(run(".5 + 1.25")).toEqual({ ok: true, value: 1.75 });
  });

  it("reads built-ins and {Field name} references", () => {
    expect(run("points * 2")).toEqual({ ok: true, value: 6 });
    expect(run("{Estimate (h)} - {Actual}")).toEqual({ ok: true, value: 3 });
  });

  it("is empty when a referenced value is missing", () => {
    expect(run("{Empty} + 1")).toEqual({ ok: true, value: null });
  });

  it("reports errors instead of throwing", () => {
    expect(run("1 +")).toMatchObject({ ok: false });
    expect(run("(1 + 2")).toMatchObject({ ok: false, error: "Missing )" });
    expect(run("2 3")).toMatchObject({ ok: false });
    expect(run("1 / 0")).toMatchObject({ ok: false, error: "Division by zero" });
    expect(run("{Nope} * 2")).toMatchObject({ ok: false, error: 'Unknown field "Nope"' });
    expect(run("alert(1)")).toMatchObject({ ok: false });
    expect(run("1; process.exit()")).toMatchObject({ ok: false });
    expect(run("")).toMatchObject({ ok: false, error: "Formula is empty" });
    expect(run("{unclosed")).toMatchObject({ ok: false, error: "Missing }" });
  });

  it("lists the references it parsed", () => {
    expect(parseFormula("points * {A} + {A}")).toMatchObject({ ok: true, refs: ["points", "A"] });
  });
});

const fields: Pick<CustomField, "id" | "name" | "type" | "config">[] = [
  { id: "f1", name: "Estimate (h)", type: "number", config: {} },
  { id: "f2", name: "Progress", type: "progress", config: {} },
  { id: "f3", name: "Customer", type: "text", config: {} },
];

describe("validateFormula / computeFormula", () => {
  it("accepts number/progress fields and points, case-insensitively", () => {
    expect(validateFormula("{estimate (h)} * 2 + points + {Progress}", fields)).toBeNull();
    expect(validateFormula("{Customer} * 2", fields)).toMatch(/Unknown field/);
    expect(validateFormula("2 *", fields)).toBeTruthy();
  });

  it("computes from a task's values", () => {
    const field = { config: { expression: "{Estimate (h)} * 2 + points" } };
    expect(computeFormula(field, { points: 3, customFields: { f1: 4 } }, fields)).toEqual({ ok: true, value: 11 });
    expect(computeFormula(field, { points: 3, customFields: {} }, fields)).toEqual({ ok: true, value: null });
  });
});

describe("parseCustomFieldValue", () => {
  const dropdown = { type: "dropdown" as const, config: { options: [{ id: "o1", name: "High", color: "#ff0000" }] } };
  it("validates per type", () => {
    expect(parseCustomFieldValue({ type: "text", config: {} }, "  hi ")).toEqual({ ok: true, value: "hi" });
    expect(parseCustomFieldValue({ type: "text", config: {} }, "  ")).toEqual({ ok: true, value: null });
    expect(parseCustomFieldValue({ type: "number", config: {} }, 4.5)).toEqual({ ok: true, value: 4.5 });
    expect(parseCustomFieldValue({ type: "number", config: {} }, "4")).toMatchObject({ ok: false });
    expect(parseCustomFieldValue({ type: "progress", config: {} }, 42.4)).toEqual({ ok: true, value: 42 });
    expect(parseCustomFieldValue({ type: "progress", config: {} }, 101)).toMatchObject({ ok: false });
    expect(parseCustomFieldValue({ type: "checkbox", config: {} }, true)).toEqual({ ok: true, value: true });
    expect(parseCustomFieldValue({ type: "checkbox", config: {} }, false)).toEqual({ ok: true, value: null });
    expect(parseCustomFieldValue({ type: "date", config: {} }, "2026-10-07")).toEqual({ ok: true, value: "2026-10-07" });
    expect(parseCustomFieldValue({ type: "date", config: {} }, "2026-13-45")).toMatchObject({ ok: false });
    expect(parseCustomFieldValue(dropdown, "o1")).toEqual({ ok: true, value: "o1" });
    expect(parseCustomFieldValue(dropdown, "o2")).toMatchObject({ ok: false });
    expect(parseCustomFieldValue({ type: "people", config: {} }, ["not-a-uuid"])).toMatchObject({ ok: false });
    expect(parseCustomFieldValue({ type: "people", config: {} }, [])).toEqual({ ok: true, value: null });
    expect(parseCustomFieldValue({ type: "formula", config: {} }, 1)).toMatchObject({ ok: false });
    expect(parseCustomFieldValue({ type: "number", config: {} }, null)).toEqual({ ok: true, value: null });
  });
});

describe("saved view config", () => {
  it("defaults custom filters and sort for views saved before custom fields", () => {
    const parsed = savedViewConfigSchema.parse({ filters: {} });
    expect(parsed.filters.custom).toEqual([]);
    expect(parsed.sort).toBeNull();
  });
});
