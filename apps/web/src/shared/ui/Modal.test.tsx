import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Modal, { ModalContent, ModalTrigger, useModal } from "./ModalCompound";
import { Menu, MenuContent, MenuTrigger, useMenu } from "./Menu/MenuCompound";

function CloseFromInside() {
  const { closeModal } = useModal();
  return <button type="button" onClick={closeModal}>done</button>;
}

function renderModal(onClose?: () => void) {
  return render(
    <Modal onClose={onClose}>
      <ModalTrigger>
        <button type="button">open modal</button>
      </ModalTrigger>
      <ModalContent>
        <p>modal body</p>
        <CloseFromInside />
      </ModalContent>
    </Modal>,
  );
}

describe("Modal", () => {
  it("opens from the trigger and closes on Escape, returning focus", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByText("open modal"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("open modal")).toHaveFocus();
  });

  it("closes from the built-in close button and from closeModal(), calling onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal(onClose);
    await user.click(screen.getByText("open modal"));
    await user.click(screen.getByLabelText("modal close button"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByText("open modal"));
    await user.click(screen.getByText("done"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("can start open", () => {
    render(
      <Modal initialOpen>
        <ModalContent>
          <p>welcome</p>
        </ModalContent>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("welcome");
  });

  it("stays open while a Modal nested inside a Menu's content is open, and closes the menu when the dialog closes", async () => {
    function MenuItemWithModal() {
      const { toggleMenu } = useMenu();
      return (
        <li>
          <Modal onClose={toggleMenu}>
            <ModalTrigger>
              <button type="button">open dialog from menu</button>
            </ModalTrigger>
            <ModalContent>
              <p>dialog body</p>
            </ModalContent>
          </Modal>
        </li>
      );
    }

    const user = userEvent.setup();
    render(
      <Menu>
        <MenuTrigger>
          <button type="button">open menu</button>
        </MenuTrigger>
        <MenuContent>
          <ul>
            <MenuItemWithModal />
          </ul>
        </MenuContent>
      </Menu>,
    );

    await user.click(screen.getByText("open menu"));
    expect(screen.getByText("open dialog from menu")).toBeInTheDocument();

    await user.click(screen.getByText("open dialog from menu"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Clicking inside the dialog body must not close the menu/dialog.
    await user.click(screen.getByText("dialog body"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("open dialog from menu")).toBeInTheDocument();

    // Closing the dialog (Escape) also closes the menu.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("open dialog from menu")).not.toBeInTheDocument();
  });
});
