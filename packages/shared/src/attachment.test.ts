import { describe, expect, it } from "vitest";
import { formatFileSize, safeFileName } from "./attachment.js";

describe("formatFileSize", () => {
  it("formats bytes, kilobytes and megabytes", () => {
    expect(formatFileSize(12)).toBe("12 B");
    expect(formatFileSize(340 * 1024)).toBe("340 KB");
    expect(formatFileSize(1.25 * 1024 * 1024)).toBe("1.3 MB");
    expect(formatFileSize(4 * 1024 * 1024)).toBe("4 MB");
  });
});

describe("safeFileName", () => {
  it("strips path separators and collapses spaces", () => {
    expect(safeFileName("../my report?.pdf")).toBe("..my-report.pdf");
    expect(safeFileName("a/b\c.png")).toBe("abc.png");
  });
  it("never returns an empty or dot-only name", () => {
    expect(safeFileName("   ")).toBe("file");
    expect(safeFileName("..")).toBe("file");
  });
  it("truncates long names but keeps the extension", () => {
    const name = safeFileName(`${"x".repeat(150)}.webp`);
    expect(name).toHaveLength(100);
    expect(name.endsWith(".webp")).toBe(true);
  });
});
