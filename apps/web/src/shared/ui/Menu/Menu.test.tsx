import { render, screen, waitFor } from "@testing-library/react";
import { describe, it } from "vitest";
import { Menu, MenuContent, MenuTrigger, useMenu } from "./MenuCompound";
import { ToolTip, ToolTipTrigger, ToolTipMessage } from "@/shared/ui/ToolTip/ToolTip";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

describe("Menu", () => {
  const renderMenu = () => {
    return render(
      <>
        <Menu>
          <MenuTrigger>
            <button>open menu</button>
          </MenuTrigger>
          <MenuContent>
            <div>content</div>
          </MenuContent>
        </Menu>
        <div>outside</div>
      </>,
    );
  };

  it("should not be opened", async () => {
    renderMenu();

    const triggerEle = screen.getByText(/open menu/i);
    const contentEle = screen.queryByText(/content/i);

    expect(triggerEle).toBeInTheDocument();
    expect(contentEle).not.toBeInTheDocument();
  });

  it("should open when click the trigger", async () => {
    const user = userEvent.setup();

    renderMenu();

    const triggerEle = screen.getByText(/open menu/i);
    await user.click(triggerEle);

    const contentEle = screen.getByText(/content/i);
    expect(contentEle).toBeInTheDocument();
  });

  it("should close when the trigger is clicked again", async () => {
    renderMenu();

    const user = userEvent.setup();
    await user.click(screen.getByText(/open menu/i));

    await user.click(screen.getByText(/open menu/i));

    expect(screen.queryByText(/content/i)).not.toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByText(/open menu/i));
    expect(screen.getByText(/^content$/i)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByText(/^content$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/open menu/i)).toHaveFocus();
  });

  it("opens from the keyboard", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.tab();
    expect(screen.getByText(/open menu/i)).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText(/^content$/i)).toBeInTheDocument();
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByText(/open menu/i));
    await user.click(screen.getByText(/outside/i));
    expect(screen.queryByText(/^content$/i)).not.toBeInTheDocument();
  });

  it("keeps a controlled menu open when it's opened from another menu's item", async () => {
    // Regression for the "Change avatar" flow: an item inside one menu
    // (the options menu) opens a second, controlled menu (the avatar
    // picker) and closes itself. The picker must survive the options
    // menu's close-focus-return, not get dismissed by it.
    const OptionsItem = ({ onOpenPicker }: { onOpenPicker: () => void }) => {
      const { toggleMenu } = useMenu();
      return (
        <button
          onClick={() => {
            onOpenPicker();
            toggleMenu();
          }}
        >
          change avatar
        </button>
      );
    };

    const Harness = () => {
      const [pickerOpen, setPickerOpen] = useState(false);
      return (
        <>
          <Menu outerIsOpen={pickerOpen} outerSetIsOpen={setPickerOpen}>
            <MenuTrigger>
              <button>avatar</button>
            </MenuTrigger>
            <MenuContent>
              <div>picker content</div>
            </MenuContent>
          </Menu>
          <Menu>
            <MenuTrigger>
              <button>options</button>
            </MenuTrigger>
            <MenuContent>
              <OptionsItem onOpenPicker={() => setPickerOpen(true)} />
            </MenuContent>
          </Menu>
        </>
      );
    };

    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText(/^options$/i));
    await user.click(screen.getByText(/change avatar/i));

    await waitFor(() => {
      expect(screen.getByText(/^picker content$/i)).toBeInTheDocument();
    });
  });

  it("should be open when passing the open props", async () => {
    render(
      <Menu outerIsOpen={true}>
        <MenuTrigger>
          <button>open menu</button>
        </MenuTrigger>
        <MenuContent>
          <div>content</div>
        </MenuContent>
      </Menu>,
    );

    expect(screen.getByText(/content/i)).toBeInTheDocument();
  });

  it("should change the outer state when close or open", async () => {
    const Warper = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <Menu outerIsOpen={isOpen} outerSetIsOpen={setIsOpen}>
            <MenuTrigger>
              <button>open menu</button>
            </MenuTrigger>
            <MenuContent>
              <div>content</div>
            </MenuContent>
          </Menu>
          {isOpen ? <span>opened</span> : <span>not opened</span>}
        </>
      );
    };

    render(<Warper />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/open menu/!));
    expect(screen.getByText(/opened/i)).toBeInTheDocument();
    await user.click(screen.getByText(/open menu/!));
    expect(screen.getByText(/not opened/i)).toBeInTheDocument();
  });

  it("does not reopen a tooltip on the trigger after picking a menu item by pointer", async () => {
    // Regression: many menu triggers are wrapped in a ToolTip whose Radix
    // trigger opens on focus. Radix's default close-auto-focus behavior
    // refocuses the menu trigger after a pointer-driven selection, which
    // would pop the tooltip open right after picking an option.
    const PickItem = () => {
      const { toggleMenu } = useMenu();
      return <button onClick={() => toggleMenu()}>pick me</button>;
    };

    render(
      <ToolTip>
        <ToolTipTrigger>
          <Menu>
            <MenuTrigger>
              <button>open menu</button>
            </MenuTrigger>
            <MenuContent>
              <PickItem />
            </MenuContent>
          </Menu>
        </ToolTipTrigger>
        <ToolTipMessage>Space settings</ToolTipMessage>
      </ToolTip>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText(/open menu/i));
    await user.click(screen.getByText(/pick me/i));

    expect(screen.queryByText(/^pick me$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("still returns focus to the trigger on Escape after an earlier pointer-driven close", async () => {
    // Regression: the "was this a pointer interaction" tracking ref must be
    // reset on every open, not carried over from a previous open/close
    // cycle. Otherwise a stale `true` left over from a pointer-driven close
    // would make a later keyboard/Escape close wrongly skip the focus
    // return to the trigger — specifically when focus has already left the
    // content before Escape is pressed, so the content's own onKeyDown
    // (which also clears the ref) never gets a chance to run first.
    const PickItem = () => {
      const { toggleMenu } = useMenu();
      return <button onClick={() => toggleMenu()}>pick me</button>;
    };

    render(
      <Menu>
        <MenuTrigger>
          <button>open menu</button>
        </MenuTrigger>
        <MenuContent>
          <PickItem />
        </MenuContent>
      </Menu>,
    );

    const user = userEvent.setup();

    // First cycle: open, then close via a pointer interaction inside the
    // content (sets the ref to true).
    await user.click(screen.getByText(/open menu/i));
    await user.click(screen.getByText(/pick me/i));
    expect(screen.queryByText(/^pick me$/i)).not.toBeInTheDocument();

    // Second cycle: reopen via the trigger (a click on the trigger, not on
    // the content, so it does not itself reset the ref).
    await user.click(screen.getByText(/open menu/i));
    expect(screen.getByText(/^pick me$/i)).toBeInTheDocument();

    // Move focus off the (auto-focused) content without any keydown or
    // pointerdown on it, so neither of the existing reset handlers fire —
    // this isolates the case the open-reset fix is for.
    (document.activeElement as HTMLElement | null)?.blur();

    await user.keyboard("{Escape}");
    expect(screen.queryByText(/^pick me$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/open menu/i)).toHaveFocus();
  });

  it("when menu open or close outerSetIsOpen should be called once", async () => {
    const mockFn = vi.fn();

    const Warper = () => {
      return (
        <>
          <Menu outerSetIsOpen={mockFn}>
            <MenuTrigger>
              <button>open menu</button>
            </MenuTrigger>
            <MenuContent>
              <div>content</div>
            </MenuContent>
          </Menu>
        </>
      );
    };

    render(<Warper />);
    const user = userEvent.setup();
    await user.click(screen.getByText(/open menu/!));
    expect(mockFn).toHaveBeenCalledTimes(1);
    await user.click(screen.getByText(/open menu/!));
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
