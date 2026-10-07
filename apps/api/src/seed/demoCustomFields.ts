import { randomUUID } from "node:crypto";
import type { CustomFieldConfig, CustomFieldType, CustomFieldValue, SavedViewConfig } from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import type { DemoRows } from "./demoWorkspace.js";

/**
 * Custom fields on the Sprint 14 board (the guest's landing list), one of every type, with values on
 * most tasks, plus a saved view that filters and sorts by them. Shown as Table columns and in the
 * task panel. Date values are calendar days ("YYYY-MM-DD") relative to the seeding day.
 */

const SEVERITY = [
  { id: "sev-low", name: "Low", color: "#1090e0" },
  { id: "sev-medium", name: "Medium", color: "#f8ae00" },
  { id: "sev-high", name: "High", color: "#e16b16" },
  { id: "sev-critical", name: "Critical", color: "#e50000" },
];

const FIELDS: { key: string; name: string; type: CustomFieldType; config?: CustomFieldConfig }[] = [
  { key: "severity", name: "Severity", type: "dropdown", config: { options: SEVERITY } },
  { key: "estimate", name: "Estimate (h)", type: "number" },
  { key: "effort", name: "Effort score", type: "formula", config: { expression: "points * 2 + {Estimate (h)}" } },
  { key: "progress", name: "Progress", type: "progress" },
  { key: "customer", name: "Customer", type: "text" },
  { key: "reviewer", name: "Reviewer", type: "people" },
  { key: "qa", name: "QA passed", type: "checkbox" },
  { key: "release", name: "Release date", type: "date" },
];

type Row = {
  severity?: "low" | "medium" | "high" | "critical";
  estimate?: number;
  customer?: string;
  /** Index into the teammates. */
  reviewer?: number;
  progress?: number;
  qa?: boolean;
  /** Day offset of the release date. */
  release?: number;
};

/** Values by Sprint 14 task key (tasks left out stay empty). */
const VALUES: Record<string, Row> = {
  sso: { severity: "high", estimate: 6, customer: "Acme Corp", reviewer: 0, progress: 60, release: 7 },
  "onboarding-checklist": { severity: "medium", estimate: 4, customer: "Globex", progress: 0, release: 7 },
  "api-rate-limit": { severity: "critical", estimate: 8, customer: "Initech", reviewer: 1, progress: 85, release: 2 },
  "csv-export": { severity: "low", estimate: 3, customer: "Umbrella Health", progress: 0 },
  "dark-mode-charts": { severity: "low", estimate: 2, reviewer: 2, progress: 40, release: 7 },
  "billing-webhooks": { severity: "critical", estimate: 5, customer: "Hooli", reviewer: 3, progress: 90, release: 1 },
  "search-index": { severity: "high", estimate: 12, customer: "Acme Corp", progress: 10, release: 21 },
  "notification-prefs": { severity: "medium", estimate: 3, progress: 0 },
  "recurring-tasks": { severity: "low", estimate: 6, customer: "Globex" },
  "board-virtualization": { severity: "critical", estimate: 10, customer: "Stark Industries", reviewer: 4, progress: 45, release: 7 },
  "audit-log": { severity: "medium", estimate: 5, customer: "Initech", progress: 0, release: 14 },
  "mobile-nav": { severity: "medium", estimate: 4, reviewer: 5, progress: 75, release: 7 },
  "release-notes": { severity: "low", estimate: 1, progress: 20 },
  "flaky-e2e": { severity: "high", estimate: 2, reviewer: 0, progress: 50 },
  "design-tokens": { severity: "medium", estimate: 5, reviewer: 1, progress: 100, qa: true, release: -5 },
  "node-upgrade": { severity: "high", estimate: 9, reviewer: 2, progress: 100, qa: true, release: -4 },
  "feature-flags": { severity: "medium", estimate: 8, customer: "Hooli", reviewer: 3, progress: 100, qa: true, release: -3 },
  "error-tracking": { severity: "low", estimate: 3, progress: 100, qa: true, release: -2 },
  "welcome-emails": { severity: "low", estimate: 4, customer: "Umbrella Health", reviewer: 4, progress: 100, qa: false, release: -1 },
  "bulk-edit": { severity: "high", estimate: 7, customer: "Stark Industries", reviewer: 5, progress: 100, qa: true, release: -1 },
  retro: { estimate: 1 },
  "i18n-strings": { severity: "low", estimate: 3, progress: 100, qa: true },
};

const isoDay = (now: Date, offset: number) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset, 12)).toISOString().slice(0, 10);

export function buildDemoCustomFields(
  ownerUserId: string,
  seed: Pick<DemoRows, "idsByKey" | "landingListId">,
  teammateIds: string[],
  now = new Date(),
  newId: () => string = randomUUID,
) {
  const listId = seed.idsByKey.get("sprint");
  if (!listId) return { fields: [], values: [], savedViews: [] };

  const ids = new Map(FIELDS.map((f) => [f.key, newId()]));
  const fields: Prisma.CustomFieldCreateManyInput[] = FIELDS.map((f, order) => ({
    id: ids.get(f.key)!,
    listId,
    name: f.name,
    type: f.type,
    order,
    config: (f.config ?? {}) as Prisma.InputJsonObject,
  }));

  const values: Prisma.CustomFieldValueCreateManyInput[] = [];
  const add = (taskId: string, key: string, value: CustomFieldValue | undefined) => {
    if (value !== undefined) values.push({ taskId, fieldId: ids.get(key)!, value });
  };
  for (const [taskKey, row] of Object.entries(VALUES)) {
    const taskId = seed.idsByKey.get(`sprint.${taskKey}`);
    if (!taskId) continue;
    add(taskId, "severity", row.severity && `sev-${row.severity}`);
    add(taskId, "estimate", row.estimate);
    add(taskId, "progress", row.progress);
    add(taskId, "customer", row.customer);
    const reviewer = row.reviewer === undefined ? undefined : teammateIds[row.reviewer % Math.max(teammateIds.length, 1)];
    add(taskId, "reviewer", reviewer ? [reviewer] : undefined);
    add(taskId, "qa", row.qa || undefined);
    add(taskId, "release", row.release === undefined ? undefined : isoDay(now, row.release));
  }

  const config: SavedViewConfig = {
    filters: {
      assignees: [],
      statuses: [],
      priorities: [],
      tags: [],
      due: null,
      custom: [{ fieldId: ids.get("severity")!, op: "is", value: ["sev-high", "sev-critical"] }],
    },
    groupBy: "status",
    swimlanes: "none",
    sort: { fieldId: ids.get("effort")!, dir: "desc" },
  };
  const savedViews =
    listId === seed.landingListId
      ? [{ id: newId(), listId, userId: ownerUserId, name: "High severity, by effort", config, isDefault: false }]
      : [];

  return { fields, values, savedViews };
}
