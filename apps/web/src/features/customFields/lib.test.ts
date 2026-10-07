import { describe, expect, it } from "vitest";
import type { Task } from "@/features/task/types";
import { filterByCustomFields, filterIsComplete, resolveValue, sortByCustomField } from "./lib";
import type { CustomField } from "./types";

const field = (id: string, type: CustomField["type"], config: CustomField["config"] = {}): CustomField => ({
  id,
  listId: "l",
  name: id,
  type,
  order: 0,
  config,
});

const severity = field("Severity", "dropdown", {
  options: [
    { id: "low", name: "Low", color: "#000000" },
    { id: "high", name: "High", color: "#ff0000" },
  ],
});
const estimate = field("Estimate", "number");
const score = field("Score", "formula", { expression: "{Estimate} * 2 + points" });
const broken = field("Broken", "formula", { expression: "{Estimate} *" });
const qa = field("QA", "checkbox");
const release = field("Release", "date");
const reviewer = field("Reviewer", "people");
const customer = field("Customer", "text");
const fields = [severity, estimate, score, broken, qa, release, reviewer, customer];

const task = (id: string, points: number | null, customFields: Task["customFields"]) => ({ id, points, customFields }) as Task;
const tasks = [
  task("a", 3, { Severity: "high", Estimate: 4, QA: true, Release: "2026-10-20", Reviewer: ["u1"], Customer: "Acme Corp" }),
  task("b", 1, { Severity: "low", Estimate: 10, Release: "2026-10-01", Customer: "Globex" }),
  task("c", null, { Estimate: 2 }),
  task("d", 5, {}),
];
const ids = (list: Task[]) => list.map((t) => t.id);

describe("resolveValue", () => {
  it("computes formulas on read and reports bad ones", () => {
    expect(resolveValue(score, tasks[0]!, fields)).toEqual({ value: 11 });
    expect(resolveValue(score, tasks[2]!, fields)).toEqual({ value: null });
    expect(resolveValue(broken, tasks[0]!, fields).error).toBeTruthy();
    expect(resolveValue(customer, tasks[1]!, fields)).toEqual({ value: "Globex" });
  });
});

describe("filterByCustomFields", () => {
  const run = (filter: Parameters<typeof filterByCustomFields>[1]) => ids(filterByCustomFields(tasks, filter, fields));

  it("filters per type", () => {
    expect(run([{ fieldId: "Severity", op: "is", value: ["high"] }])).toEqual(["a"]);
    expect(run([{ fieldId: "Severity", op: "is_not", value: ["high"] }])).toEqual(["b", "c", "d"]);
    expect(run([{ fieldId: "Estimate", op: "gt", value: 3 }])).toEqual(["a", "b"]);
    expect(run([{ fieldId: "Estimate", op: "eq", value: 2 }])).toEqual(["c"]);
    expect(run([{ fieldId: "Score", op: "lt", value: 12 }])).toEqual(["a"]);
    expect(run([{ fieldId: "QA", op: "checked" }])).toEqual(["a"]);
    expect(run([{ fieldId: "QA", op: "unchecked" }])).toEqual(["b", "c", "d"]);
    expect(run([{ fieldId: "Release", op: "before", value: "2026-10-10" }])).toEqual(["b"]);
    expect(run([{ fieldId: "Release", op: "after", value: "2026-10-10" }])).toEqual(["a"]);
    expect(run([{ fieldId: "Reviewer", op: "includes", value: ["u1", "u2"] }])).toEqual(["a"]);
    expect(run([{ fieldId: "Customer", op: "contains", value: "acme" }])).toEqual(["a"]);
    expect(run([{ fieldId: "Customer", op: "empty" }])).toEqual(["c", "d"]);
    expect(run([{ fieldId: "Severity", op: "set" }, { fieldId: "Estimate", op: "gt", value: 5 }])).toEqual(["b"]);
  });

  it("ignores incomplete filters and deleted fields", () => {
    expect(filterIsComplete({ fieldId: "Severity", op: "is", value: [] })).toBe(false);
    expect(run([{ fieldId: "Severity", op: "is", value: [] }])).toEqual(["a", "b", "c", "d"]);
    expect(run([{ fieldId: "gone", op: "set" }])).toEqual(["a", "b", "c", "d"]);
  });
});

describe("sortByCustomField", () => {
  it("sorts numbers, formulas, dropdown order and text, empties last", () => {
    expect(ids(sortByCustomField(tasks, { fieldId: "Estimate", dir: "asc" }, fields))).toEqual(["c", "a", "b", "d"]);
    expect(ids(sortByCustomField(tasks, { fieldId: "Estimate", dir: "desc" }, fields))).toEqual(["b", "a", "c", "d"]);
    expect(ids(sortByCustomField(tasks, { fieldId: "Score", dir: "desc" }, fields))).toEqual(["b", "a", "c", "d"]);
    expect(ids(sortByCustomField(tasks, { fieldId: "Severity", dir: "desc" }, fields))).toEqual(["a", "b", "c", "d"]);
    expect(ids(sortByCustomField(tasks, { fieldId: "Customer", dir: "asc" }, fields))).toEqual(["a", "b", "c", "d"]);
  });

  it("keeps the order without a sort or for a deleted field", () => {
    expect(ids(sortByCustomField(tasks, null, fields))).toEqual(["a", "b", "c", "d"]);
    expect(ids(sortByCustomField(tasks, { fieldId: "gone", dir: "asc" }, fields))).toEqual(["a", "b", "c", "d"]);
  });
});
