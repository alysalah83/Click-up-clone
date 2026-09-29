import { expect, test, type Page } from "@playwright/test";

async function dragTo(
  page: Page,
  from: ReturnType<Page["locator"]>,
  to: ReturnType<Page["locator"]>,
) {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  if (!a || !b) throw new Error("drag source or target not visible");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 12, {
    steps: 5,
  });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
  await page.mouse.move(b.x + b.width / 2 + 2, b.y + b.height / 2 + 2, {
    steps: 3,
  });
  await page.mouse.up();
}

test("guest demo path: onboarding, board drag, task details, table bulk edit, calendar, sign out", async ({
  page,
}) => {
  // 1. Continue as guest
  await page.goto("/login");
  await page.getByRole("button", { name: "signup as guest button" }).click();

  // 2. Onboarding wizard: space, list, status, task
  const wizard = page.getByRole("dialog");
  await wizard.getByPlaceholder("Enter workspace name").fill("E2E Space");
  await wizard.getByRole("button", { name: "go next button" }).click();
  await wizard.getByPlaceholder("Enter List name").fill("E2E List");
  await wizard.getByRole("button", { name: "go next button" }).click();
  await wizard.getByPlaceholder("Status Name").fill("Backlog");
  await wizard.getByRole("button", { name: "go next button" }).click();
  await wizard.getByPlaceholder("Task Name").fill("E2E Task");
  await wizard.getByRole("button", { name: "go next button" }).click();

  // 3. Board shows the task
  await expect(page).toHaveURL(/\/home\/lists\/.+\/board/);
  const card = page.getByRole("button", { name: /E2E Task/ });
  await expect(card).toBeVisible();

  // 4. Drag to the "in progress" column
  const inProgressColumn = page
    .locator("div")
    .filter({ has: page.getByText("in progress", { exact: true }) })
    .filter({ has: page.getByText("Add Task") })
    .last();
  await expect(inProgressColumn).toBeVisible();
  await dragTo(page, card, inProgressColumn);
  await expect(inProgressColumn.getByText("E2E Task")).toBeVisible();

  // 5. Card click opens the details dialog; Escape closes it
  await inProgressColumn
    .getByRole("button", { name: /E2E Task/ })
    .first()
    .click();
  const details = page.getByRole("dialog", { name: "Task details" });
  await expect(details).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(details).toBeHidden();

  // 6. Table view: select all, bulk set priority to urgent
  await page.goto(page.url().replace(/\/board.*$/, "/table"));
  await page.getByRole("checkbox", { name: "checkbox" }).first().click();
  await page.getByRole("button", { name: "update priority button" }).click();
  await page.getByText("Urgent", { exact: true }).click();
  // menu has closed, so the only remaining "Urgent" is the row's priority cell
  await expect(page.getByText("Urgent", { exact: true })).toHaveCount(1);

  // 7. Calendar view renders
  await page.goto(page.url().replace(/\/table.*$/, "/calendar"));
  await expect(
    page.getByRole("button", { name: "month", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeVisible();

  // 8. Sign out
  await page.getByRole("button", { name: "sign out button" }).click();
  await expect(page).toHaveURL(/\/login/);
});
