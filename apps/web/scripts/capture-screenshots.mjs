// Captures the landing images (public/landing/*.webp), README screenshots (repo assets/screenshots/*.png),
// the README demo GIF (assets/demo.gif) and the Open Graph image (src/app/opengraph-image.png)
// from the live guest demo.
//
//   node apps/web/scripts/capture-screenshots.mjs [baseUrl] [--only=landing,readme,gif,og]
//
// Needs `pnpm --filter @clickup/web exec playwright install chromium` once.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

// sharp ships with Next (image optimization), so no extra dependency is needed.
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next"))("sharp");

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(WEB, "../..");
const BASE = process.argv.find((a) => a.startsWith("http")) ?? "https://click-up-clone-two.vercel.app";
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const ONLY = new Set((onlyArg?.slice(7) ?? "landing,readme,gif,og").split(","));
const SHOTS = path.join(ROOT, "assets/screenshots");
mkdirSync(SHOTS, { recursive: true });

const NO_MOTION = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
const TASK = /Export tasks to CSV/;
// Has a description, subtasks, tags and activity: the best-looking task panel.
const RICH_TASK = /Add Google SSO to the login page/;

async function newPage(browser, { theme = "dark", width = 1440, height = 900, mobile = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    colorScheme: theme,
    locale: "en-US",
    isMobile: mobile,
    hasTouch: mobile,
  });
  await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  return page;
}

/** Signs in as a fresh guest and returns the Sprint Board URL. Logs how long it took. */
async function guestLogin(page) {
  await page.goto(`${BASE}/login`);
  const started = Date.now();
  await page.getByRole("button", { name: "signup as guest button" }).click();
  await page.waitForURL(/\/home\/lists\/.+\/board/, { timeout: 60_000 });
  await page.getByRole("button", { name: TASK }).first().waitFor();
  console.log(`guest login to seeded board: ${Date.now() - started} ms`);
  await page.addStyleTag({ content: NO_MOTION });
  return page.url();
}

async function settle(page, ms = 1200) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.addStyleTag({ content: NO_MOTION }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function go(page, url) {
  await page.goto(url);
  await settle(page);
}

const view = (boardUrl, name) => boardUrl.replace(/\/board.*$/, `/${name}`);

async function openTask(page) {
  await page.getByRole("button", { name: RICH_TASK }).first().click();
  const panel = page.getByRole("dialog", { name: "Task details" });
  await panel.getByRole("textbox", { name: "task name", exact: true }).waitFor();
  await panel.getByText("Activity", { exact: true }).first().waitFor();
  await settle(page, 1500);
}

/** Opens the first sidebar link whose href contains `part` (e.g. a chat channel or whiteboard). */
async function goToLink(page, part, ms = 1500) {
  const link = page.locator(`a[href*="${part}"]`).first();
  await link.waitFor({ state: "attached" });
  await go(page, new URL(await link.getAttribute("href"), BASE).href);
  await settle(page, ms);
}

/** Opens a list by its sidebar name and returns its board URL. */
async function goToList(page, name) {
  const link = page.locator('a[href*="/home/lists/"]', { hasText: name }).first();
  await link.waitFor({ state: "attached" });
  await go(page, new URL(await link.getAttribute("href"), BASE).href);
  return page.url();
}

async function save(page, file, { webp = false } = {}) {
  const buffer = await page.screenshot();
  if (webp) await sharp(buffer).resize({ width: 1920 }).webp({ quality: 82 }).toFile(file);
  else await sharp(buffer).resize({ width: 1600 }).png({ compressionLevel: 9, palette: true }).toFile(file);
  console.log("wrote", path.relative(ROOT, file));
}

async function landing(browser) {
  for (const theme of ["dark", "light"]) {
    const page = await newPage(browser, { theme });
    const board = await guestLogin(page);
    const out = (key) => path.join(WEB, `public/landing/${key}-${theme}.webp`);
    await settle(page);
    await save(page, out("board"), { webp: true });
    await go(page, view(board, "timeline"));
    await save(page, out("timeline"), { webp: true });
    await go(page, board);
    await openTask(page);
    await save(page, out("task"), { webp: true });
    await go(page, `${BASE}/home/dashboard`);
    await save(page, out("dashboard"), { webp: true });
    await go(page, view(board, "workload"));
    await save(page, out("workload"), { webp: true });
    await go(page, view(board, "mindmap"));
    await settle(page, 1500);
    await save(page, out("mindmap"), { webp: true });
    await goToLink(page, "/home/chat/");
    await save(page, out("chat"), { webp: true });
    await page.context().close();
  }
}

async function readme(browser) {
  const page = await newPage(browser);
  const board = await guestLogin(page);
  const shot = (name) => save(page, path.join(SHOTS, `${name}.png`));
  await settle(page);
  await shot("board");
  await openTask(page);
  await shot("task-panel");
  for (const name of ["list", "table", "calendar", "timeline", "workload", "mindmap", "sprint"]) {
    await go(page, view(board, name));
    await shot(name);
  }
  for (const name of ["dashboard", "my-work", "inbox", "docs", "teams", "goals"]) {
    await go(page, `${BASE}/home/${name}`);
    if (name === "docs") {
      // open the first doc in the sidebar tree so the editor shows
      const doc = page.locator('a[href*="/home/docs/"]').first();
      if (await doc.count()) await go(page, new URL(await doc.getAttribute("href"), BASE).href);
    }
    await shot(name);
  }
  await goToLink(page, "/home/chat/");
  await shot("chat");
  // Excalidraw needs a moment to convert the seeded scene and zoom to fit.
  await goToLink(page, "/home/whiteboards/", 5000);
  await shot("whiteboard");
  const bugTracker = await goToList(page, "Bug Tracker");
  await go(page, view(bugTracker, "form"));
  await shot("form");
  await go(page, `${BASE}/login`);
  await page.context().close();

  const light = await newPage(browser, { theme: "light" });
  await guestLogin(light);
  await settle(light);
  await save(light, path.join(SHOTS, "board-light.png"));
  await light.context().close();

  const phone = await newPage(browser, { width: 390, height: 844, mobile: true });
  const phoneBoard = await guestLogin(phone);
  await settle(phone);
  await save(phone, path.join(SHOTS, "mobile-board.png"));
  await go(phone, view(phoneBoard, "calendar"));
  await save(phone, path.join(SHOTS, "mobile-calendar.png"));
  await phone.context().close();
}

/** A ~15 s tour as an animated GIF: landing, one-click demo, board, task panel, timeline, dashboard. */
async function gif(browser) {
  const width = 1280;
  const height = 800;
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: "dark", locale: "en-US" });
  await context.addInitScript(() => localStorage.setItem("theme", "dark"));
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  const frames = [];
  const grab = async (holdMs) => {
    const png = await page.screenshot();
    frames.push({ png, delay: holdMs });
  };
  const hold = async (ms) => {
    await settle(page, 400);
    await grab(ms);
  };
  // A few frames while scrolling so motion reads as motion.
  const scroll = async (dy, steps = 6) => {
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, dy / steps);
      await page.waitForTimeout(80);
      await grab(90);
    }
  };

  await page.goto(BASE);
  await hold(1800);
  await scroll(500);
  await hold(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "signup as guest button" }).first().hover();
  await hold(700);
  await page.getByRole("button", { name: "signup as guest button" }).first().click();
  await page.waitForURL(/\/home\/lists\/.+\/board/, { timeout: 60_000 });
  await page.getByRole("button", { name: TASK }).first().waitFor();
  const board = page.url();
  await hold(2200);
  await page.getByRole("button", { name: RICH_TASK }).first().hover();
  await hold(500);
  await openTask(page);
  await hold(2600);
  await page.keyboard.press("Escape");
  await go(page, view(board, "timeline"));
  await hold(2200);
  await go(page, `${BASE}/home/dashboard`);
  await hold(2400);
  await context.close();

  const scaled = await Promise.all(
    frames.map((f) => sharp(f.png).resize({ width: 880 }).png().toBuffer()),
  );
  await sharp(scaled, { join: { animated: true } })
    .gif({ delay: frames.map((f) => f.delay), loop: 0, effort: 10, colours: 128, dither: 0 })
    .toFile(path.join(ROOT, "assets/demo.gif"));
  console.log("wrote assets/demo.gif,", frames.length, "frames");
}

/** 1200x630 social card: headline on the left, a board screenshot on the right. */
async function og(browser) {
  const shot = path.join(WEB, "public/landing/board-dark.webp");
  const boardPng = await sharp(shot).resize({ width: 1400 }).png().toBuffer();
  const icon = await sharp(path.join(WEB, "src/app/icon.png")).resize(72).png().toBuffer();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><body style="margin:0">
  <div style="width:1200px;height:630px;position:relative;overflow:hidden;font-family:'Segoe UI',Inter,system-ui,sans-serif;
    background:radial-gradient(70% 90% at 15% 10%,#4f46e5 0%,#1e1b4b 55%,#0b0a1a 100%);color:#fff">
    <img src="data:image/png;base64,${boardPng.toString("base64")}" style="position:absolute;left:560px;top:120px;width:860px;
      border-radius:16px;border:1px solid rgba(255,255,255,.18);box-shadow:0 30px 80px rgba(0,0,0,.55)">
    <div style="position:absolute;left:64px;top:72px;width:470px">
      <div style="display:flex;align-items:center;gap:16px">
        <img src="data:image/png;base64,${icon.toString("base64")}" style="width:56px;height:56px;border-radius:14px">
        <span style="font-size:30px;font-weight:700;letter-spacing:-.5px">ClickUp Clone</span>
      </div>
      <div style="margin-top:44px;font-size:54px;line-height:1.08;font-weight:800;letter-spacing:-1.5px">
        All your team's work in one place.</div>
      <div style="margin-top:24px;font-size:24px;line-height:1.4;color:#c7d2fe">
        Boards, Gantt timeline, docs, dashboards, automations and Claude AI. Full-stack Next.js + Express + Postgres.</div>
      <div style="margin-top:36px;display:inline-block;padding:14px 26px;border-radius:12px;background:#fff;color:#4338ca;
        font-size:24px;font-weight:700">Try the live demo &rarr;</div>
    </div>
  </div></body></html>`);
  await page.waitForTimeout(300);
  const png = await page.screenshot();
  await sharp(png).png({ compressionLevel: 9 }).toFile(path.join(WEB, "src/app/opengraph-image.png"));
  await sharp(png).png({ compressionLevel: 9 }).toFile(path.join(WEB, "src/app/twitter-image.png"));
  await page.close();
  console.log("wrote src/app/opengraph-image.png and twitter-image.png");
}

const browser = await chromium.launch();
try {
  if (ONLY.has("landing")) await landing(browser);
  if (ONLY.has("readme")) await readme(browser);
  if (ONLY.has("gif")) await gif(browser);
  if (ONLY.has("og")) await og(browser);
} finally {
  await browser.close();
}
