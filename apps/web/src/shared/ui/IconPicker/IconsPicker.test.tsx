import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IconPicker from "./IconsPicker";

describe("IconPicker", () => {
  it("filters icons by the search text", async () => {
    const user = userEvent.setup();
    render(<IconPicker selectedIcon={null} setSelectedIcon={vi.fn()} />);
    await user.type(screen.getByRole("searchbox", { name: /search icons/i }), "zzzz-no-match");
    expect(screen.getByText(/no icons found/i)).toBeInTheDocument();
  });
});
