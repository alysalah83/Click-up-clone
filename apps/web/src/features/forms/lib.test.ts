import { describe, expect, it } from "vitest";
import {
  changeFieldType,
  draftProblems,
  lastSubmittedLabel,
  makeField,
  mapField,
  moveField,
  removeField,
  toPublicFields,
  toSubmission,
  validateAnswers,
} from "./lib";
import type { FormField } from "./types";

const field = (f: Partial<FormField> & Pick<FormField, "id" | "type">): FormField => ({
  label: f.id,
  placeholder: "",
  required: false,
  options: [],
  mapTo: "description",
  ...f,
});

const FIELDS: FormField[] = [
  field({ id: "name", type: "short_text", mapTo: "name" }),
  field({ id: "sev", type: "dropdown", options: ["Low", "High"], mapTo: "priority" }),
  field({ id: "pri", type: "priority" }),
  field({ id: "due", type: "date" }),
];

describe("field editing", () => {
  it("maps one field per task property, moving the old one back to the description", () => {
    const next = mapField(FIELDS, "pri", "priority");
    expect(next.map((f) => f.mapTo)).toEqual(["name", "description", "priority", "description"]);
    // Incompatible type: unchanged.
    expect(mapField(FIELDS, "due", "priority")).toBe(FIELDS);
    // The name field only moves when another field takes the name.
    expect(mapField(FIELDS, "name", "description")).toBe(FIELDS);
    const renamed = mapField([...FIELDS, field({ id: "t", type: "long_text" })], "t", "name");
    expect(renamed.find((f) => f.id === "name")?.mapTo).toBe("description");
    expect(renamed.find((f) => f.id === "t")?.mapTo).toBe("name");
  });

  it("changes types safely, moves and removes fields", () => {
    expect(changeFieldType(FIELDS, "sev", "date").find((f) => f.id === "sev")?.mapTo).toBe("description");
    expect(changeFieldType(FIELDS, "name", "checkbox")).toEqual(FIELDS);
    expect(changeFieldType(FIELDS, "due", "dropdown").find((f) => f.id === "due")?.options).toHaveLength(2);
    expect(moveField(FIELDS, "sev", -1).map((f) => f.id)).toEqual(["sev", "name", "pri", "due"]);
    expect(moveField(FIELDS, "name", -1)).toBe(FIELDS);
    expect(removeField(FIELDS, "name")).toHaveLength(4);
    expect(removeField(FIELDS, "pri")).toHaveLength(3);
    expect(makeField("dropdown").options).toEqual(["Option 1", "Option 2"]);
  });

  it("reports labels and options the API would reject", () => {
    expect(draftProblems({ title: " ", fields: [field({ id: "a", type: "dropdown", label: "", mapTo: "name" })] })).toEqual({
      title: "Give the form a title",
      a: "Add a label",
    });
    expect(draftProblems({ title: "T", fields: [field({ id: "a", type: "dropdown", options: ["x", " "] })] })).toEqual({
      a: "Options cannot be empty",
    });
  });
});

describe("answers", () => {
  const publicFields = toPublicFields(FIELDS);

  it("marks the name field required in the public fields", () => {
    expect(publicFields.map((f) => f.required)).toEqual([true, false, false, false]);
    expect(publicFields[0]).not.toHaveProperty("mapTo");
  });

  it("validates like the API and builds the request body", () => {
    expect(validateAnswers(publicFields, { sev: "Medium", due: "2026-13-01" })).toEqual({
      name: "This field is required",
      sev: "Pick one of the options",
      due: "Enter a valid date",
    });
    expect(validateAnswers(publicFields, { name: "Bug", pri: "high" })).toEqual({});
    const number = toPublicFields([field({ id: "n", type: "number", mapTo: "description" })]);
    expect(toSubmission(number, { n: "4.5" })).toEqual({ n: 4.5 });
    expect(toSubmission(publicFields, { name: "Bug", sev: "" })).toEqual({ name: "Bug" });
  });

  it("labels the last response time", () => {
    const now = new Date("2026-10-06T12:00:00Z");
    expect(lastSubmittedLabel(null, now)).toBe("No responses yet");
    expect(lastSubmittedLabel("2026-10-06T11:30:00Z", now)).toBe("Last response 30 min ago");
    expect(lastSubmittedLabel("2026-10-04T12:00:00Z", now)).toBe("Last response 2 days ago");
  });
});
