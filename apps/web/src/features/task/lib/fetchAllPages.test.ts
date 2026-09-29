import { describe, expect, it, vi } from "vitest";
import { fetchAllPages } from "./fetchAllPages";

describe("fetchAllPages", () => {
  it("returns the items of a single page when there is no next cursor", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [1, 2, 3], nextCursor: null });

    const result = await fetchAllPages(fetchPage);

    expect(result).toEqual([1, 2, 3]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(undefined);
  });

  it("concatenates three pages in order, following each cursor", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [1, 2], nextCursor: "cursor-1" })
      .mockResolvedValueOnce({ items: [3, 4], nextCursor: "cursor-2" })
      .mockResolvedValueOnce({ items: [5], nextCursor: null });

    const result = await fetchAllPages(fetchPage);

    expect(result).toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(1, undefined);
    expect(fetchPage).toHaveBeenNthCalledWith(2, "cursor-1");
    expect(fetchPage).toHaveBeenNthCalledWith(3, "cursor-2");
  });

  it("stops at maxPages even if a next cursor keeps being returned", async () => {
    const fetchPage = vi.fn().mockImplementation(async (cursor?: string) => ({
      items: [cursor ?? "first"],
      nextCursor: "always-more",
    }));

    const result = await fetchAllPages(fetchPage, 3);

    expect(result).toHaveLength(3);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });
});
