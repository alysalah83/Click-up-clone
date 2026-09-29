import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import OptionsMenuItem from "./OptionsMenuItem";

describe("OptionsMenuItem", () => {
  it("names a modal option's dialog after the option label", async () => {
    const user = userEvent.setup();
    render(
      <Menu>
        <MenuTrigger>
          <button type="button">options</button>
        </MenuTrigger>
        <MenuContent>
          <ul>
            <OptionsMenuItem
              option={{
                id: "rename",
                icon: "pen",
                label: "Rename",
                color: null,
                action: null,
                display: {
                  uiForAction: "modal",
                  ActionComponent: () => <p>rename form</p>,
                },
              }}
            />
          </ul>
        </MenuContent>
      </Menu>,
    );
    await user.click(screen.getByText("options"));
    await user.click(screen.getByText("Rename"));
    expect(screen.getByRole("dialog", { name: "Rename" })).toHaveTextContent(
      "rename form",
    );
  });
});
