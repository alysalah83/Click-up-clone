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

test("guest demo path: seeded board, drag, task details, table bulk edit, calendar, sign out", async ({
  page,
}) => {
  // 1. Continue as guest: lands on the seeded Sprint Board, no onboarding wizard
  await page.goto("/login");
  await page.getByRole("button", { name: "signup as guest button" }).click();
  await expect(page).toHaveURL(/\/home\/lists\/.+\/board/);
  await expect(page.getByPlaceholder("Enter workspace name")).toHaveCount(0);

  // 2. Board shows seeded tasks
  const card = page.getByRole("button", { name: /Export tasks to CSV/ });
  await expect(card).toBeVisible();

  // 3. Drag to the "in progress" column
  const inProgressColumn = page
    .locator("div")
    .filter({ has: page.getByText("in progress", { exact: true }) })
    .filter({ has: page.getByText("Add Task") })
    .last();
  await expect(inProgressColumn).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  await dragTo(page, card, inProgressColumn);
  await expect(inProgressColumn.getByText("Export tasks to CSV")).toBeVisible();

  // 4. Card click opens the details dialog; Escape closes it
  await inProgressColumn
    .getByRole("button", { name: /Export tasks to CSV/ })
    .first()
    .click();
  const details = page.getByRole("dialog", { name: "Task details" });
  await expect(details).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(details).toBeHidden();

  // 5. Table view: select all, bulk set priority to urgent
  await page.goto(page.url().replace(/\/board.*$/, "/table"));
  await page.getByRole("checkbox", { name: "checkbox" }).first().click();
  await page.getByRole("button", { name: "update priority button" }).click();
  await page.locator("menu").getByText("Urgent", { exact: true }).click();
  // the selected task's row now shows the urgent priority
  const taskRow = page.locator("main").filter({ hasText: "Export tasks to CSV" }).last();
  await expect(taskRow.getByText("Urgent", { exact: true })).toBeVisible();

  // 6. Calendar view renders
  await page.goto(page.url().replace(/\/table.*$/, "/calendar"));
  await expect(
    page.getByRole("button", { name: "month", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeVisible();

  // 7. Sign out
  await page.getByRole("button", { name: "sign out button" }).click();
  await expect(page).toHaveURL(/\/login/);
});
