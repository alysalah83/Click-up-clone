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

  it("should still be open when clicking inside menu", async () => {
    const { triggerEle, user } = renderDropdown();
    await user.hover(triggerEle.parentElement!);
    const menu = screen.getByText("content");
    await user.click(menu);
    expect(menu).toBeInTheDocument();
  });
});
