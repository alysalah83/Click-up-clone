import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Toaster from "./Toaster";
import Modal, { ModalContent } from "./ModalCompound";

describe("Toaster", () => {
  it("installs window.toast and renders messages through sonner", async () => {
    render(<Toaster />);
    expect(window.toast).toBeDefined();
    act(() => {
      window.toast!.success("Task (Ship it) has been added");
      window.toast!.error("Something went wrong", 7);
    });
    expect(await screen.findByText("Task (Ship it) has been added")).toBeInTheDocument();
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });

  it("keeps toasts clickable while a modal dialog is open, without dismissing the dialog", async () => {
    // sonner captures the pointer on pointerdown (swipe); jsdom lacks it.
    Element.prototype.setPointerCapture ??= () => {};
    const user = userEvent.setup();
    render(
      <>
        <Toaster />
        <Modal initialOpen>
          <ModalContent title="Create space">
            <p>dialog body</p>
          </ModalContent>
        </Modal>
      </>,
    );
    act(() => {
      window.toast!.success("Saved while dialog open");
    });
    const toastText = await screen.findByText("Saved while dialog open");
    // user-event refuses to click elements that have/inherit
    // pointer-events: none (which Radix sets on <body> for modal dialogs).
    await user.click(toastText);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
