import { describe, expect, it } from "vitest";
import {
  chatMessageToTask,
  chatMessagesQuerySchema,
  createChatChannelSchema,
  mentionedUserIds,
  normalizeChannelName,
  resolvePlainMentions,
} from "./index.js";

const MAYA = "11111111-1111-4111-8111-111111111111";
const MARK = "22222222-2222-4222-8222-222222222222";
const LIAM = "33333333-3333-4333-8333-333333333333";
const members = [
  { id: MAYA, name: "Maya Chen" },
  { id: MARK, name: "Maya Brooks" },
  { id: LIAM, name: "Liam Patel" },
];

describe("normalizeChannelName", () => {
  it("makes a lowercase dashed slug without the hash", () => {
    expect(normalizeChannelName("#Product Updates!")).toBe("product-updates");
    expect(normalizeChannelName("  design__team  ")).toBe("design-team");
    expect(normalizeChannelName("--a--b--")).toBe("a-b");
  });

  it("rejects names with nothing usable", () => {
    expect(createChatChannelSchema.safeParse({ workspaceId: MAYA, name: "!!!" }).success).toBe(false);
    expect(createChatChannelSchema.parse({ workspaceId: MAYA, name: "Marketing" }).name).toBe("marketing");
  });
});

describe("resolvePlainMentions", () => {
  it("turns full names and unique first names into tokens", () => {
    const out = resolvePlainMentions("hey @Liam and @Maya Chen, see @Maya Brooks", members);
    expect(out).toBe(
      `hey @[Liam Patel](${LIAM}) and @[Maya Chen](${MAYA}), see @[Maya Brooks](${MARK})`,
    );
    expect(mentionedUserIds(out).sort()).toEqual([MAYA, MARK, LIAM].sort());
  });

  it("leaves ambiguous first names, emails, unknown names and existing tokens alone", () => {
    const token = `@[Liam Patel](${LIAM})`;
    expect(resolvePlainMentions(`@Maya ${token} me@liam.dev @Zoe`, members)).toBe(
      `@Maya ${token} me@liam.dev @Zoe`,
    );
  });

  it("is case-insensitive and stops at word boundaries", () => {
    expect(resolvePlainMentions("@liam: ok, @Liamx no", members)).toBe(`@[Liam Patel](${LIAM}): ok, @Liamx no`);
  });
});

describe("chatMessageToTask", () => {
  it("uses the first line as the name and the whole message plus the source as description", () => {
    const body = `\n**Fix** the \`csv\` export for @[Liam Patel](${LIAM})\nIt breaks on emoji.`;
    const { name, description } = chatMessageToTask(body, "product", "Maya Chen");
    expect(name).toBe("Fix the csv export for @Liam Patel");
    const texts = description.content.map((p) => ("content" in p ? p.content?.[0]?.text : undefined));
    expect(texts).toContain("It breaks on emoji.");
    expect(texts.at(-1)).toBe("From #product by Maya Chen");
  });

  it("caps long names at 128 characters", () => {
    expect(chatMessageToTask("x".repeat(300), "c", "A").name).toHaveLength(128);
  });
});

describe("chatMessagesQuerySchema", () => {
  it("accepts an id or a timestamp as cursor", () => {
    expect(chatMessagesQuerySchema.safeParse({ after: MAYA }).success).toBe(true);
    expect(chatMessagesQuerySchema.safeParse({ after: "2026-10-08T10:00:00.000Z" }).success).toBe(true);
    expect(chatMessagesQuerySchema.safeParse({ before: "yesterday" }).success).toBe(false);
  });
});
