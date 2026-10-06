import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MAX_ATTACHMENT_BYTES } from "@clickup/shared";
import { prisma } from "../src/lib/prisma.js";
import { createVercelBlobStorage, setBlobStorage, type BlobStorage } from "../src/lib/blobStorage.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

const EIGHT_DAYS_AGO = () => new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

/** In-memory blob store: records puts and deletes. */
function fakeStorage() {
  const blobs = new Map<string, { pathname: string; body: Buffer; contentType: string }>();
  const deleted: string[] = [];
  let n = 0;
  const storage: BlobStorage = {
    async put(pathname, body, contentType) {
      n += 1;
      const dot = pathname.lastIndexOf(".");
      const stored = dot > pathname.lastIndexOf("/") ? `${pathname.slice(0, dot)}-r${n}${pathname.slice(dot)}` : `${pathname}-r${n}`;
      const url = `https://store.public.blob.vercel-storage.com/${stored}`;
      blobs.set(url, { pathname: stored, body, contentType });
      return { url, pathname: stored };
    },
    async del(urls) {
      deleted.push(...urls);
      for (const url of urls) blobs.delete(url);
    },
  };
  return { storage, blobs, deleted };
}

let fake: ReturnType<typeof fakeStorage>;
beforeEach(() => {
  fake = fakeStorage();
  setBlobStorage(fake.storage);
});
afterEach(() => setBlobStorage(undefined));

async function setup() {
  const owner = await signUp();
  const outsider = await signUp();
  const space = await seedWorkspace(owner.cookie);
  const task = await createTask(owner.cookie, { listId: space.list.id, statusId: space.openStatus.id });
  return { owner, outsider, space, task };
}

const upload = (cookie: string, taskId: string, body: Buffer, name = "screen shot.png", type = "image/png") =>
  api()
    .post(`/api/tasks/${taskId}/attachments`)
    .set("Cookie", cookie)
    .set("Content-Type", "application/octet-stream")
    .set("x-file-name", encodeURIComponent(name))
    .set("x-file-type", type)
    .send(body);

const runCleanup = () =>
  api().get("/internal/cron/cleanup-guests").set("Authorization", "Bearer test-cron-secret").expect(200);

describe("attachments", () => {
  it("uploads a file to the blob store, lists it, logs activity and deletes it with its blob", async () => {
    const { owner, space, task } = await setup();
    const body = Buffer.from("fake png bytes");
    const res = await upload(owner.cookie, task.id, body, "Résumé (final).png").expect(201);
    expect(res.body).toMatchObject({
      taskId: task.id,
      fileName: "Résumé (final).png",
      contentType: "image/png",
      size: body.byteLength,
      uploader: { id: owner.user.id },
    });
    const [blob] = [...fake.blobs.values()];
    expect(blob!.pathname).toBe(`attachments/${space.workspace.id}/${task.id}/Résumé-(final)-r1.png`);
    expect(blob!.body.equals(body)).toBe(true);
    expect(blob!.contentType).toBe("image/png");

    const list = await api().get(`/api/tasks/${task.id}/attachments`).set("Cookie", owner.cookie).expect(200);
    expect(list.body.map((a: { id: string }) => a.id)).toEqual([res.body.id]);

    const detail = await api().get(`/api/tasks/${task.id}`).set("Cookie", owner.cookie).expect(200);
    expect(detail.body.attachmentCount).toBe(1);
    const activity = detail.body.activity as { type: string; data: { name?: string } }[];
    expect(activity.some((a) => a.type === "attachment_added" && a.data.name === "Résumé (final).png")).toBe(true);

    await api().delete(`/api/attachments/${res.body.id}`).set("Cookie", owner.cookie).expect(204);
    expect(fake.deleted).toEqual([res.body.url]);
    expect(await prisma.attachment.count()).toBe(0);
  });

  it("rejects outsiders, empty files and files over 4 MB", async () => {
    const { owner, outsider, task } = await setup();
    await upload(outsider.cookie, task.id, Buffer.from("x")).expect(404);
    await api().get(`/api/tasks/${task.id}/attachments`).set("Cookie", outsider.cookie).expect(404);
    await upload(owner.cookie, task.id, Buffer.alloc(0)).expect(400);
    const tooBig = await upload(owner.cookie, task.id, Buffer.alloc(MAX_ATTACHMENT_BYTES + 1)).expect(413);
    expect(tooBig.body.error.message).toBe("Files can be at most 4 MB");
    const wayTooBig = await upload(owner.cookie, task.id, Buffer.alloc(MAX_ATTACHMENT_BYTES + 200 * 1024)).expect(413);
    expect(wayTooBig.body.error.message).toBe("Files can be at most 4 MB");
    expect(fake.blobs.size).toBe(0);

    const created = await upload(owner.cookie, task.id, Buffer.from("x")).expect(201);
    await api().delete(`/api/attachments/${created.body.id}`).set("Cookie", outsider.cookie).expect(404);
  });

  it("answers 503 when the blob store is not configured", async () => {
    setBlobStorage(null);
    const { owner, task } = await setup();
    const res = await upload(owner.cookie, task.id, Buffer.from("x")).expect(503);
    expect(res.body.error.message).toBe("Attachments are not configured on this server");
  });

  it("deletes the blobs of a deleted task's attachments, and cascades the rows", async () => {
    const { owner, task } = await setup();
    const a = await upload(owner.cookie, task.id, Buffer.from("a")).expect(201);
    await api().delete(`/api/tasks/${task.id}`).set("Cookie", owner.cookie).expect(200);
    expect(fake.deleted).toEqual([a.body.url]);
    expect(await prisma.attachment.count()).toBe(0);
  });

  it("seeds demo attachments that point at public web assets and never touch the blob store", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const cookie = `token=${res.body.token}`;
    const seeded = await prisma.attachment.findMany({ include: { task: { select: { name: true } } } });
    expect(seeded.length).toBeGreaterThanOrEqual(8);
    expect(seeded.every((a) => a.pathname === "" && a.url.startsWith("https://"))).toBe(true);
    expect(new Set(seeded.map((a) => a.task.name))).toContain("Add Google SSO to the login page");
    expect(seeded.some((a) => a.contentType === "application/pdf")).toBe(true);
    expect(await prisma.activity.count({ where: { type: "attachment_added" } })).toBe(seeded.length);

    // Deleting a seeded attachment, and later the whole guest, leaves the blob store alone.
    await api().delete(`/api/attachments/${seeded[0]!.id}`).set("Cookie", cookie).expect(204);
    await prisma.user.update({ where: { id: res.body.user.id }, data: { createdAt: EIGHT_DAYS_AGO() } });
    await runCleanup();
    expect(fake.deleted).toEqual([]);
    expect(await prisma.attachment.count()).toBe(0);
  });

  it("guest cleanup deletes the blobs of files the guest uploaded", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const cookie = `token=${res.body.token}`;
    const seeded = await prisma.attachment.findFirstOrThrow();
    const up = await upload(cookie, seeded.taskId, Buffer.from("mine")).expect(201);
    await prisma.user.update({ where: { id: res.body.user.id }, data: { createdAt: EIGHT_DAYS_AGO() } });
    await runCleanup();
    expect(fake.deleted).toEqual([up.body.url]);
  });
});

describe("Vercel Blob client", () => {
  it("sends the @vercel/blob put and delete requests", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const blob = { url: "https://s.public.blob.vercel-storage.com/a/b-x.png", pathname: "a/b-x.png" };
      return new Response(JSON.stringify(blob), { status: 200 });
    }) as unknown as typeof fetch;
    const storage = createVercelBlobStorage("vercel_blob_rw_STORE123_secret", fetchFn);

    expect(await storage.put("a/b.png", Buffer.from("hi"), "image/png")).toEqual({
      url: "https://s.public.blob.vercel-storage.com/a/b-x.png",
      pathname: "a/b-x.png",
    });
    expect(calls[0]!.url).toBe("https://vercel.com/api/blob/?pathname=a%2Fb.png");
    expect(calls[0]!.init.method).toBe("PUT");
    expect(calls[0]!.init.headers).toMatchObject({
      authorization: "Bearer vercel_blob_rw_STORE123_secret",
      "x-api-version": "12",
      "x-vercel-blob-store-id": "STORE123",
      "x-vercel-blob-access": "public",
      "x-content-type": "image/png",
      "x-add-random-suffix": "1",
    });

    await storage.del(["https://s.public.blob.vercel-storage.com/a/b-x.png"]);
    expect(calls[1]!.url).toBe("https://vercel.com/api/blob/delete");
    expect(JSON.parse(calls[1]!.init.body as string)).toEqual({
      urls: ["https://s.public.blob.vercel-storage.com/a/b-x.png"],
    });
  });

  it("throws the API's error message", async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({ error: { code: "forbidden", message: "Access denied" } }), {
        status: 403,
      })) as unknown as typeof fetch;
    const storage = createVercelBlobStorage("vercel_blob_rw_S_x", fetchFn);
    await expect(storage.put("a", Buffer.from("x"), "text/plain")).rejects.toThrow("Vercel Blob 403: Access denied");
  });
});
