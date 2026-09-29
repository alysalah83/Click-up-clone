import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToolTip, ToolTipMessage, ToolTipTrigger } from "./ToolTip";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";

describe("ToolTip", () => {
  it("shows the message when the trigger receives keyboard focus and hides on Escape", async () => {
    const user = userEvent.setup();
    render(
      <ToolTip>
        <ToolTipMessage>Open sidebar</ToolTipMessage>
        <ToolTipTrigger>
          <button type="button">toggle</button>
        </ToolTipTrigger>
      </ToolTip>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Open sidebar");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("still opens the menu when clicked, when nested inside a MenuTrigger", async () => {
    const user = userEvent.setup();
    render(
      <Menu>
        <MenuTrigger>
          <ToolTip>
            <ToolTipMessage>hint</ToolTipMessage>
            <ToolTipTrigger>
              <button type="button">open menu</button>
            </ToolTipTrigger>
          </ToolTip>
        </MenuTrigger>
        <MenuContent>
          <div>menu content</div>
        </MenuContent>
      </Menu>,
    );

    await user.click(screen.getByText(/open menu/i));

    expect(screen.getByText(/menu content/i)).toBeInTheDocument();
  });
});
