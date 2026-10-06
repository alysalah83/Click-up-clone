import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import type { DemoRows } from "./demoWorkspace.js";

/**
 * Demo attachments: screenshots and a spec PDF that ship in the web app's public folder,
 * linked by absolute WEB_URL URLs. Their `pathname` is empty, which marks them as not on the
 * blob store, so deleting them (or cleaning up the guest) never touches Vercel Blob.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

interface DemoFile {
  path: string;
  name: string;
  type: string;
  size: number;
}

const webp = (file: string, name: string, size: number): DemoFile => ({ path: `landing/${file}`, name, type: "image/webp", size });

const DEMO_ATTACHMENTS: { task: string; uploader: number; files: DemoFile[] }[] = [
  {
    task: "sprint.sso",
    uploader: 0,
    files: [
      { path: "demo/sso-login-spec.pdf", name: "sso-login-spec.pdf", type: "application/pdf", size: 1840 },
      webp("board-light.webp", "board-light.webp", 116730),
      webp("board-dark.webp", "board-dark.webp", 111700),
    ],
  },
  {
    task: "sprint.dark-mode-charts",
    uploader: 1,
    files: [
      webp("dashboard-light.webp", "dashboard-light.webp", 62830),
      webp("dashboard-dark.webp", "dashboard-dark.webp", 59558),
    ],
  },
  {
    task: "sprint.design-tokens",
    uploader: 2,
    files: [
      webp("task-light.webp", "task-panel-light.webp", 71572),
      webp("task-dark.webp", "task-panel-dark.webp", 70602),
    ],
  },
  {
    task: "launch.landing-page",
    uploader: 3,
    files: [
      { path: "logo.png", name: "logo.png", type: "image/png", size: 1388147 },
      webp("timeline-light.webp", "timeline-light.webp", 90014),
      webp("timeline-dark.webp", "timeline-dark.webp", 92846),
    ],
  },
];

export function buildDemoAttachments(
  seed: DemoRows,
  uploaderIds: string[],
  now = new Date(),
  newId: () => string = randomUUID,
) {
  const taskById = new Map(seed.tasks.map((t) => [t.id, t]));
  const attachments: {
    id: string;
    taskId: string;
    uploaderId: string;
    fileName: string;
    contentType: string;
    size: number;
    url: string;
    pathname: string;
    createdAt: Date;
  }[] = [];
  const activities: { id: string; taskId: string; actorId: string; type: "attachment_added"; data: { name: string }; createdAt: Date }[] = [];

  for (const { task: key, uploader, files } of DEMO_ATTACHMENTS) {
    const task = taskById.get(seed.idsByKey.get(key) ?? "");
    const uploaderId = uploaderIds[uploader % Math.max(uploaderIds.length, 1)];
    if (!task || !uploaderId) continue;
    const base = Math.min(task.createdAt.getTime() + 3 * HOUR, now.getTime() - 6 * HOUR);
    files.forEach((file, i) => {
      const createdAt = new Date(base + i * 10 * MINUTE);
      attachments.push({
        id: newId(),
        taskId: task.id,
        uploaderId,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        url: `${env.WEB_URL}/${file.path}`,
        pathname: "",
        createdAt,
      });
      activities.push({ id: newId(), taskId: task.id, actorId: uploaderId, type: "attachment_added", data: { name: file.name }, createdAt });
    });
  }
  return { attachments, activities };
}
