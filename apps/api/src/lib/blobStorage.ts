import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

/** Where task attachments live. Production uses Vercel Blob; tests swap in an in-memory fake. */
export interface BlobStorage {
  put(pathname: string, body: Buffer, contentType: string): Promise<{ url: string; pathname: string }>;
  /** Deletes blobs by URL. Callers treat failures as best effort. */
  del(urls: string[]): Promise<void>;
}

// The REST protocol of `@vercel/blob` (packages/blob/src/api.ts, put.ts, del.ts in vercel/storage).
const BLOB_API_URL = (process.env.VERCEL_BLOB_API_URL ?? "https://vercel.com/api/blob").replace(/\/$/, "");
const BLOB_API_VERSION = "12";

/** A read-write token looks like `vercel_blob_rw_<storeId>_<secret>`. */
const storeIdOf = (token: string) => token.split("_")[3] ?? "";

async function blobError(res: Response) {
  const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  return new Error(`Vercel Blob ${res.status}: ${body?.error?.message ?? body?.error?.code ?? res.statusText}`);
}

export function createVercelBlobStorage(token: string, fetchFn: typeof fetch = fetch): BlobStorage {
  const headers = () => ({
    authorization: `Bearer ${token}`,
    "x-api-version": BLOB_API_VERSION,
    "x-api-blob-request-id": `${storeIdOf(token)}:${Date.now()}:${randomUUID().slice(0, 8)}`,
    "x-api-blob-request-attempt": "0",
    "x-vercel-blob-store-id": storeIdOf(token),
  });

  return {
    async put(pathname, body, contentType) {
      const res = await fetchFn(`${BLOB_API_URL}/?${new URLSearchParams({ pathname })}`, {
        method: "PUT",
        headers: {
          ...headers(),
          "x-vercel-blob-access": "public",
          "x-content-type": contentType,
          "x-add-random-suffix": "1",
          "x-content-length": String(body.byteLength),
        },
        body: new Uint8Array(body),
      });
      if (!res.ok) throw await blobError(res);
      const json = (await res.json()) as { url: string; pathname: string };
      return { url: json.url, pathname: json.pathname };
    },
    async del(urls) {
      if (urls.length === 0) return;
      const res = await fetchFn(`${BLOB_API_URL}/delete`, {
        method: "POST",
        headers: { ...headers(), "content-type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      if (!res.ok) throw await blobError(res);
    },
  };
}

let override: BlobStorage | null | undefined;
let cached: BlobStorage | undefined;

/** The configured store, or null when BLOB_READ_WRITE_TOKEN is missing (local development). */
export function getBlobStorage(): BlobStorage | null {
  if (override !== undefined) return override;
  if (!env.BLOB_READ_WRITE_TOKEN) return null;
  cached ??= createVercelBlobStorage(env.BLOB_READ_WRITE_TOKEN);
  return cached;
}

/** Tests: a fake store, `null` for "not configured", `undefined` to restore the real one. */
export function setBlobStorage(storage: BlobStorage | null | undefined) {
  override = storage;
}

/** Deletes blobs, logging instead of throwing: a leftover blob must never fail a request. */
export async function deleteBlobsBestEffort(urls: string[]) {
  const storage = getBlobStorage();
  if (!storage || urls.length === 0) return;
  try {
    // The delete endpoint takes many URLs at once; keep batches modest.
    for (let i = 0; i < urls.length; i += 500) await storage.del(urls.slice(i, i + 500));
  } catch (error) {
    console.error("Failed to delete attachment blobs", error);
  }
}
