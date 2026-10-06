import { describe, expect, it } from "vitest";
import { downloadUrl, fileKind, formatFileSize, MAX_ATTACHMENT_BYTES, partitionBySize } from "./lib";

describe("attachments lib", () => {
  it("formats file sizes", () => {
    expect(formatFileSize(900)).toBe("900 B");
    expect(formatFileSize(71572)).toBe("70 KB");
    expect(formatFileSize(1388147)).toBe("1.3 MB");
  });

  it("detects the file kind from content type, then extension", () => {
    expect(fileKind("image/webp", "a.webp")).toBe("image");
    expect(fileKind("application/pdf", "spec")).toBe("pdf");
    expect(fileKind("application/octet-stream", "Budget.XLSX")).toBe("sheet");
    expect(fileKind("", "notes.md")).toBe("doc");
    expect(fileKind("image/tiff", "scan.tiff")).toBe("other");
  });

  it("adds ?download=1 to blob store URLs only", () => {
    expect(downloadUrl("https://abc.public.blob.vercel-storage.com/a/b.png")).toBe(
      "https://abc.public.blob.vercel-storage.com/a/b.png?download=1",
    );
    expect(downloadUrl("https://example.com/landing/a.webp")).toBe("https://example.com/landing/a.webp");
  });

  it("splits files over the 4 MB limit and skips empty ones", () => {
    const files = [{ size: 10 }, { size: MAX_ATTACHMENT_BYTES + 1 }, { size: 0 }, { size: MAX_ATTACHMENT_BYTES }];
    const { ok, tooBig } = partitionBySize(files);
    expect(ok).toEqual([{ size: 10 }, { size: MAX_ATTACHMENT_BYTES }]);
    expect(tooBig).toEqual([{ size: MAX_ATTACHMENT_BYTES + 1 }]);
  });
});
