import { randomUUID } from "node:crypto";
import type { Prisma } from "../generated/prisma/client.js";
import { newShareToken } from "../services/shareLink.service.js";
import type { DemoRows } from "./demoWorkspace.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** The Marketing space's list and its plan doc are already shared, so both Share popovers show a live link. */
export const DEMO_SHARED_LIST_KEY = "launch";
export const DEMO_SHARED_DOC_TITLE = "Q4 launch plan";

export function buildDemoShareLinks(
  ownerUserId: string,
  seed: Pick<DemoRows, "idsByKey">,
  docs: { id: string; title: string; workspaceId: string }[],
  now = new Date(),
): Prisma.ShareLinkCreateManyInput[] {
  const links: Prisma.ShareLinkCreateManyInput[] = [];
  const listId = seed.idsByKey.get(DEMO_SHARED_LIST_KEY);
  const workspaceId = seed.idsByKey.get("marketing");
  if (listId && workspaceId)
    links.push({
      id: randomUUID(),
      token: newShareToken(),
      resourceType: "list",
      listId,
      workspaceId,
      createdById: ownerUserId,
      viewCount: 14,
      lastViewedAt: new Date(now.getTime() - 3 * HOUR),
      createdAt: new Date(now.getTime() - 6 * DAY),
      updatedAt: new Date(now.getTime() - 6 * DAY),
    });
  const doc = docs.find((d) => d.title === DEMO_SHARED_DOC_TITLE);
  if (doc)
    links.push({
      id: randomUUID(),
      token: newShareToken(),
      resourceType: "doc",
      docId: doc.id,
      workspaceId: doc.workspaceId,
      createdById: ownerUserId,
      viewCount: 6,
      lastViewedAt: new Date(now.getTime() - 26 * HOUR),
      createdAt: new Date(now.getTime() - 4 * DAY),
      updatedAt: new Date(now.getTime() - 4 * DAY),
    });
  return links;
}
