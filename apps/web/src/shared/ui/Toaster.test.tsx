import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Toaster from "./Toaster";

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
});
