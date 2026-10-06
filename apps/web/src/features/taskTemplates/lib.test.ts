import { describe, expect, it } from "vitest";
import { filterTemplates, summaryParts } from "./lib";
import type { TaskTemplate } from "./types";

const template = (name: string, overrides: Partial<TaskTemplate["snapshot"]> = {}) =>
  ({
    id: name,
    name,
    description: "",
    workspace: { id: "w", name: "Product" },
    snapshot: {
      name,
      description: null,
      priority: "none",
      points: null,
      tags: [],
      dueInDays: null,
      subtasks: [],
      checklists: [],
      ...overrides,
    },
  }) as unknown as TaskTemplate;

describe("filterTemplates", () => {
  it("matches name, task name and space, case-insensitively", () => {
    const list = [template("Bug report"), template("Meeting notes")];
    expect(filterTemplates(list, " BUG ").map((t) => t.name)).toEqual(["Bug report"]);
    expect(filterTemplates(list, "product")).toHaveLength(2);
    expect(filterTemplates(list, "")).toHaveLength(2);
  });
});

describe("summaryParts", () => {
  it("lists only what the template includes", () => {
    expect(summaryParts(template("Empty"))).toEqual([]);
    expect(
      summaryParts(
        template("Bug", {
          subtasks: [{ name: "Fix", priority: "high" }],
          checklists: [{ name: "Triage", items: ["a", "b"] }],
          dueInDays: 1,
        }),
      ),
    ).toEqual(["1 subtask", "2 checklist items", "due in 1 day"]);
  });
});
