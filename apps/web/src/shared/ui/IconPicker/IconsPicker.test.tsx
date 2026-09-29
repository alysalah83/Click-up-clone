import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IconPicker from "./IconsPicker";

describe("IconPicker", () => {
  it("filters icons by the search text", async () => {
    const user = userEvent.setup();
    render(<IconPicker selectedIcon={null} setSelectedIcon={vi.fn()} />);
    await user.type(
      screen.getByRole("searchbox", { name: /search icons/i }),
      "zzzz-no-match",
    );
    expect(screen.getByText(/no icons found/i)).toBeInTheDocument();
  });

  it("keeps the search box outside the scrolling list and scrolls back to the top on filter", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <IconPicker selectedIcon={null} setSelectedIcon={vi.fn()} />,
    );
    const search = screen.getByRole("searchbox", { name: /search icons/i });
    const scroller = container.querySelector<HTMLElement>(
      '[data-slot="icons-scroll"]',
    )!;
    expect(scroller).toBeInTheDocument();
    expect(scroller).not.toContainElement(search);

    scroller.scrollTop = 200;
    await user.type(search, "a");
    expect(scroller.scrollTop).toBe(0);
  });
});
