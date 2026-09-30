import SignupGuestBtn from "@/features/auth/components/SignupGuestBtn";
import ApiWarmup from "@/shared/components/ApiWarmup";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  Bot,
  CalendarClock,
  ChevronRight,
  FileText,
  Inbox,
  Repeat,
  Timer,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import icon from "./icon.png";

const REPO_URL = "https://github.com/alysalah83/Click-up-clone";

const SHOWCASE = [
  {
    key: "board",
    title: "Boards your team will actually use",
    desc: "Drag cards across custom statuses, see assignees, priorities and due dates at a glance, then filter, group and save the view you like.",
    alt: "Kanban board with statuses, assignees and priorities",
  },
  {
    key: "timeline",
    title: "Plan on a Timeline",
    desc: 'A Gantt view with drag-to-reschedule, resizable bars and "blocked by" dependency arrows, so slips are visible before they hurt.',
    alt: "Timeline Gantt view with dependency arrows",
  },
  {
    key: "task",
    title: "A task panel with everything in it",
    desc: "Rich-text descriptions, subtasks, checklists, tags, comments with @mentions, an activity log, and AI to summarize or break work down.",
    alt: "Task panel with description, subtasks and activity log",
  },
  {
    key: "dashboard",
    title: "Dashboards that answer questions",
    desc: "Workload by assignee, overdue work, what shipped this week and a sprint burndown, straight from your tasks.",
    alt: "Dashboard with workload, priorities and assignee charts",
  },
] as const;

const FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: Zap,
    title: "Automations",
    desc: "Trigger, condition and action rules per list: set a status, assign or notify automatically.",
  },
  {
    Icon: Bot,
    title: "Claude AI",
    desc: "Summarize a task or generate subtasks in one click.",
  },
  {
    Icon: Bookmark,
    title: "Saved views",
    desc: "Filters, grouping and sorting saved per list, with a default view.",
  },
  {
    Icon: Inbox,
    title: "My Work and Inbox",
    desc: "Everything assigned to you by due date, plus notifications for mentions and assignments.",
  },
  {
    Icon: Users,
    title: "Teams",
    desc: "Members, roles and invite links, so you can try it with a second account.",
  },
  {
    Icon: Timer,
    title: "Time tracking",
    desc: "Log time against a task and see where the hours go.",
  },
  {
    Icon: Repeat,
    title: "Recurring tasks",
    desc: "Daily, weekly or monthly tasks that recreate themselves.",
  },
  {
    Icon: FileText,
    title: "Docs",
    desc: "Write docs next to the work they describe.",
  },
];

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

function Shot({
  name,
  alt,
  priority = false,
}: {
  name: string;
  alt: string;
  priority?: boolean;
}) {
  const sizes = "(min-width: 1152px) 1100px, 100vw";
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl shadow-indigo-500/10 ring-1 ring-black/5 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-indigo-500/20">
      <Image
        width={1440}
        height={900}
        alt={alt}
        sizes={sizes}
        priority={priority}
        src={`/landing/${name}-light.webp`}
        className="h-auto w-full dark:hidden"
      />
      <Image
        width={1440}
        height={900}
        alt={alt}
        sizes={sizes}
        priority={priority}
        src={`/landing/${name}-dark.webp`}
        className="hidden h-auto w-full dark:block"
      />
    </div>
  );
}

function Page() {
  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <ApiWarmup />

      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/80 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-950/80">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src={icon} alt="" width={28} height={28} />
            <span className="text-lg font-extrabold tracking-tight">
              Click Up
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              className="hidden size-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 sm:flex dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <GithubMark className="size-5" />
            </a>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.22),transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,58,237,0.35),transparent_70%)]"
          />
          <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-14 text-center sm:px-6 sm:pt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-indigo-700 sm:text-sm dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-200">
              <CalendarClock className="size-4" />
              Open-source work management
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
              One place for all your work,
              <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-fuchsia-300">
                {" "}
                without the chaos.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-xl dark:text-neutral-300">
              Boards, timelines, tasks, dashboards, automations and AI in one
              workspace. Open a pre-filled demo with a full team in one click.
              No sign-up needed.
            </p>

            <div className="mt-9 flex w-full flex-col items-center gap-3">
              <div className="w-full max-w-sm sm:max-w-md">
                <SignupGuestBtn
                  stretch
                  type="colored"
                  label="Try the live demo"
                  extraClasses="!py-4 !text-lg !font-bold !normal-case shadow-xl shadow-indigo-500/30"
                />
              </div>
              <p className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                or
                <Link
                  href="/signup"
                  className="inline-flex items-center px-1.5 py-2 font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                >
                  Sign up
                </Link>
                /
                <Link
                  href="/login"
                  className="inline-flex items-center px-1.5 py-2 font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                >
                  Log in
                  <ChevronRight className="size-4" />
                </Link>
              </p>
            </div>
          </div>

          <div className="relative mx-auto mt-10 max-w-6xl px-4 sm:mt-14 sm:px-6">
            <Shot
              name="board"
              alt="Click Up board view with statuses, assignees and priorities"
              priority
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Every view your team needs
          </h2>
          <div className="mt-14 flex flex-col gap-16 sm:gap-24">
            {SHOWCASE.map((s, i) => (
              <div
                key={s.key}
                className="grid items-center gap-8 lg:grid-cols-5 lg:gap-12"
              >
                <div className={`lg:col-span-2 ${i % 2 ? "lg:order-2" : ""}`}>
                  <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {s.desc}
                  </p>
                </div>
                <div className={`lg:col-span-3 ${i % 2 ? "lg:order-1" : ""}`}>
                  <Shot name={s.key} alt={s.alt} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-neutral-50 px-4 py-20 sm:px-6 sm:py-28 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              And a lot more under the hood
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <div className="relative mx-auto flex max-w-3xl flex-col items-center overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-14 text-center shadow-xl">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              See it with real data
            </h2>
            <p className="mt-3 max-w-md text-indigo-100">
              The demo workspace comes with 80 tasks, 6 teammates and working
              automations.
            </p>
            <div className="mt-8 w-full max-w-xs">
              <SignupGuestBtn
                stretch
                type="primary"
                label="Try the live demo"
                extraClasses="!bg-white !text-indigo-700 hover:!bg-indigo-50 !normal-case"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 px-4 py-8 sm:px-6 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Image src={icon} alt="" width={20} height={20} />
            Click Up, a portfolio project. Not affiliated with ClickUp.
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
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
