import { render, screen } from "@testing-library/react";
import { describe, it } from "vitest";
import { Menu, MenuContent, MenuTrigger } from "./MenuCompound";
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

  it("should be close when clicking outside content", async () => {
    renderMenu();

    const user = userEvent.setup();
    await user.click(screen.getByText(/open menu/i));

    await user.click(screen.getByText(/open menu/i));

    expect(screen.queryByText(/content/i)).not.toBeInTheDocument();
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
