import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Menu, MenuContent, MenuTrigger } from "../Menu/MenuCompound";
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

  it("stays open while focus moves between items of a portaled Menu opened inside it", async () => {
    // Regression: Menu/Modal content inside DropdownMenu is portaled to
    // <body>, but React still bubbles its focusout/focusin through the
    // DropdownTrigger. A DOM-containment check on relatedTarget treated a
    // focus move inside the open menu as "focus left the dropdown", hid the
    // DropdownMenu and unmounted the menu with it.
    const user = userEvent.setup();
    render(
      <Dropdown>
        <DropdownTrigger>
          <button type="button">row</button>
          <DropdownMenu>
            <Menu>
              <MenuTrigger>
                <button type="button">row settings</button>
              </MenuTrigger>
              <MenuContent>
                <button type="button">first item</button>
                <button type="button">second item</button>
              </MenuContent>
            </Menu>
          </DropdownMenu>
        </DropdownTrigger>
      </Dropdown>,
    );
    await user.tab();
    await user.click(screen.getByText("row settings"));
    const first = screen.getByText("first item");
    const second = screen.getByText("second item");

    fireEvent.focusOut(first, { relatedTarget: second });
    fireEvent.focusIn(second, { relatedTarget: first });
    await act(async () => {
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });
    fireEvent.focusOut(second, { relatedTarget: first });
    fireEvent.focusIn(first, { relatedTarget: second });
    await act(async () => {
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(screen.getByText("first item")).toBeInTheDocument();
    expect(screen.getByText("second item")).toBeInTheDocument();
  });

  it("hides when focus leaves the whole dropdown", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Dropdown>
          <DropdownTrigger>
            <button type="button">row</button>
            <DropdownMenu>
              <span>row actions</span>
            </DropdownMenu>
          </DropdownTrigger>
        </Dropdown>
        <button type="button">outside</button>
      </>,
    );
    await user.tab();
    expect(screen.getByText("row actions")).toBeInTheDocument();
    await user.tab();
    expect(screen.getByText("outside")).toHaveFocus();
    await waitFor(() => expect(screen.queryByText("row actions")).not.toBeInTheDocument());
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
