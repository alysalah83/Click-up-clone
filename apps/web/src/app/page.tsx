import SignupGuestBtn from "@/features/auth/components/SignupGuestBtn";
import ApiWarmup from "@/shared/components/ApiWarmup";
import Image from "next/image";
import Link from "next/link";
import ViewShowcase from "@/features/landing/ViewShowcase";
import { jakarta } from "@/features/landing/font";
import icon from "./icon.png";

const REPO_URL = "https://github.com/alysalah83/Click-up-clone";

const NAV_LINK =
  "rounded-lg px-3 py-2 hover:bg-[#f4f4f8] hover:text-[#1f1f2e] dark:hover:bg-neutral-800 dark:hover:text-white";

const PRIMARY_BTN =
  "!bg-[#7b68ee] hover:!bg-[#6a57e3] !normal-case !rounded-lg !px-7 !py-3.5 !shadow-none";

const FEATURES = [
  {
    title: "Automations",
    desc: "When a status changes, assign someone, move the task or send a notification.",
  },
  {
    title: "Claude AI",
    desc: "Summarize a long task or split it into subtasks.",
  },
  {
    title: "Sprints",
    desc: "Story points, a burndown chart and velocity across sprints.",
  },
  {
    title: "Goals",
    desc: "Targets that fill up as the linked tasks get done.",
  },
  {
    title: "Whiteboards",
    desc: "Sketch a plan, then turn sticky notes into tasks.",
  },
  {
    title: "Forms",
    desc: "A public form for a list. Every submission becomes a task.",
  },
  {
    title: "Docs",
    desc: "Write specs and notes next to the work they describe.",
  },
  {
    title: "Time tracking",
    desc: "Start a timer on a task and see where the hours went.",
  },
] as const;

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function Page() {
  return (
    <div
      className={`${jakarta.className} relative min-h-dvh w-full overflow-x-hidden bg-white text-[#1f1f2e] dark:bg-neutral-950 dark:text-neutral-100`}
    >
      <ApiWarmup />

      <header className="sticky top-0 z-30 border-b border-[#ececf2] bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src={icon} alt="" width={26} height={26} />
              <span className="text-[17px] font-extrabold tracking-tight">
                Click Up
              </span>
            </Link>
            <div className="hidden items-center gap-1 text-sm font-medium text-[#4a4a5c] md:flex dark:text-neutral-300">
              <a href="#views" className={NAV_LINK}>
                Views
              </a>
              <a href="#features" className={NAV_LINK}>
                Features
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={NAV_LINK}
              >
                GitHub
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-[#f4f4f8] dark:hover:bg-neutral-800"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#7b68ee] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6a57e3]"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
          <h1 className="text-[2.6rem] font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-7xl">
            All your team&rsquo;s work,
            <br className="hidden sm:block" /> in one app.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#55556a] sm:text-xl dark:text-neutral-400">
            Boards, timelines, sprints, docs and dashboards that share the same
            tasks. The demo opens a workspace with 80 tasks and six teammates
            already in it.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="w-full sm:w-auto">
              <SignupGuestBtn
                stretch
                type="colored"
                label="Open the demo workspace"
                extraClasses={PRIMARY_BTN}
              />
            </div>
            <Link
              href="/signup"
              className="w-full rounded-lg border border-[#d9d9e3] px-7 py-3.5 text-base font-semibold hover:border-[#1f1f2e] sm:w-auto dark:border-neutral-700 dark:hover:border-neutral-300"
            >
              Create an account
            </Link>
          </div>
          <p className="mt-4 text-sm text-[#7a7a8c] dark:text-neutral-500">
            No sign-up needed for the demo.
          </p>
        </section>

        <section
          id="views"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6 sm:pt-20"
        >
          <ViewShowcase />
        </section>

        <section
          id="features"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32"
        >
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-[-0.025em] sm:text-[2.6rem] sm:leading-[1.1]">
              Everything else a team asks for
            </h2>
            <p className="mt-4 text-lg text-[#55556a] dark:text-neutral-400">
              All of it works in the demo, on the same tasks.
            </p>
          </div>
          <dl className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ title, desc }) => (
              <div
                key={title}
                className="border-t-2 border-[#1f1f2e] pt-4 dark:border-neutral-200"
              >
                <dt className="text-base font-bold">{title}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-[#55556a] dark:text-neutral-400">
                  {desc}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-[#7b68ee] px-4 py-20 text-white sm:px-6 sm:py-24">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="text-3xl font-extrabold tracking-[-0.025em] sm:text-[2.6rem] sm:leading-[1.1]">
                Click around a real workspace
              </h2>
              <p className="mt-3 text-lg text-white/85">
                Move cards, run an automation, plan a sprint. Nothing to set up.
              </p>
            </div>
            <div className="w-full shrink-0 md:w-auto">
              <SignupGuestBtn
                stretch
                type="primary"
                label="Open the demo workspace"
                extraClasses="!bg-white !text-[#1f1f2e] hover:!bg-[#f4f2ff] !normal-case !rounded-lg !px-7 !py-3.5 !shadow-none"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-[#7a7a8c] dark:text-neutral-400">
            <Image src={icon} alt="" width={20} height={20} />
            Click Up, a portfolio project. Not affiliated with ClickUp.
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[#f4f4f8] dark:hover:bg-neutral-800"
          >
            <GithubMark className="size-5" />
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Page;
