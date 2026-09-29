import { describe, expect, it } from "vitest";
import { shouldOpenTaskDetail } from "./shouldOpenTaskDetail";

function buildCard() {
  const card = document.createElement("div");
  const nameSpan = document.createElement("span");
  nameSpan.textContent = "Task name";
  const button = document.createElement("button");
  button.type = "button";
  card.appendChild(nameSpan);
  card.appendChild(button);
  return { card, nameSpan, button };
}

describe("shouldOpenTaskDetail", () => {
  it("returns true for a click on the card body", () => {
    const { card, nameSpan } = buildCard();
    expect(
      shouldOpenTaskDetail({
        target: nameSpan,
        currentTarget: card,
        isRenameOpen: false,
        isTempTask: false,
      }),
    ).toBe(true);
  });

  it("returns false for a click on a button inside the card", () => {
    const { card, button } = buildCard();
    expect(
      shouldOpenTaskDetail({
        target: button,
        currentTarget: card,
        isRenameOpen: false,
        isTempTask: false,
      }),
    ).toBe(false);
  });

  it("returns false when the target is outside the card's DOM (a portaled menu/dialog)", () => {
    const { card } = buildCard();
    const portaled = document.createElement("div");
    portaled.setAttribute("role", "menu");
    document.body.appendChild(portaled);
    expect(
      shouldOpenTaskDetail({
        target: portaled,
        currentTarget: card,
        isRenameOpen: false,
        isTempTask: false,
      }),
    ).toBe(false);
    document.body.removeChild(portaled);
  });

  it("returns false while renaming, even for a click on the card body", () => {
    const { card, nameSpan } = buildCard();
    expect(
      shouldOpenTaskDetail({
        target: nameSpan,
        currentTarget: card,
        isRenameOpen: true,
        isTempTask: false,
      }),
    ).toBe(false);
  });

  it("returns false for a temp task, even for a click on the card body", () => {
    const { card, nameSpan } = buildCard();
    expect(
      shouldOpenTaskDetail({
        target: nameSpan,
        currentTarget: card,
        isRenameOpen: false,
        isTempTask: true,
      }),
    ).toBe(false);
  });

  it("returns true for Enter or Space pressed on the card itself", () => {
    const { card } = buildCard();
    expect(
      shouldOpenTaskDetail({
        target: card,
        currentTarget: card,
        isRenameOpen: false,
        isTempTask: false,
        key: "Enter",
      }),
    ).toBe(true);
    expect(
      shouldOpenTaskDetail({
        target: card,
        currentTarget: card,
        isRenameOpen: false,
        isTempTask: false,
        key: " ",
      }),
    ).toBe(true);
  });

  it("returns false for a key pressed while focus is on an inner element (e.g. a button)", () => {
    const { card, button } = buildCard();
    expect(
      shouldOpenTaskDetail({
        target: button,
        currentTarget: card,
        isRenameOpen: false,
        isTempTask: false,
        key: "Enter",
      }),
    ).toBe(false);
  });

  it("returns false for any other key pressed on the card itself", () => {
    const { card } = buildCard();
    expect(
      shouldOpenTaskDetail({
        target: card,
        currentTarget: card,
        isRenameOpen: false,
        isTempTask: false,
        key: "Tab",
      }),
    ).toBe(false);
  });
});
