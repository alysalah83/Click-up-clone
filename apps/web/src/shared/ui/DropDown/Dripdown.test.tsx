import { render, screen } from "@testing-library/react";
import { describe } from "vitest";
import { Dropdown, DropdownMenu, DropdownTrigger } from "./DropdownCompound";
import userEvent from "@testing-library/user-event";

describe("dropdown", () => {
  const renderDropdown = () => {
    const user = userEvent.setup();
    render(
      <Dropdown toggleOnChildClick={true}>
        <DropdownTrigger>
          <div>
            container
            <DropdownMenu>
              <div>content</div>
            </DropdownMenu>
          </div>
        </DropdownTrigger>
      </Dropdown>,
    );

    return {
      triggerEle: screen.getByText("container"),
      user,
    };
  };

  it("should appear when mouse enter the trigger element", async () => {
    const { triggerEle, user } = renderDropdown();
    await user.hover(triggerEle);
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  // Still skipped: DropdownMenu's stopPropagation should keep this open, but
  // jsdom does not implement real layout / elementsFromPoint, so
  // @testing-library/user-event's click() cannot correctly hit-test that the
  // click target is a descendant of the trigger. It fires a spurious
  // mouseleave on the trigger div, which closes the menu via the documented
  // onMouseLeave behavior. Reproduced in isolation (single test, no shared
  // state) — not a pointer-state leak between tests. Fixing this without
  // guarding onMouseLeave the way onBlur is guarded (a hover/click behavior
  // change the brief asked us not to make) is out of scope for Step 4.
  it.skip("should still be open when clicking inside menu", async () => {
    const { triggerEle, user } = renderDropdown();
    await user.hover(triggerEle.parentElement!);
    const menu = screen.getByText("content");
    await user.click(menu);
    expect(menu).toBeInTheDocument();
  });

  it("reveals the menu when the trigger area receives keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <Dropdown>
        <DropdownTrigger>
          <button type="button">row</button>
          <DropdownMenu>
            <span>row actions</span>
          </DropdownMenu>
        </DropdownTrigger>
      </Dropdown>,
    );
    await user.tab();
    expect(screen.getByText("row actions")).toBeInTheDocument();
  });
});
