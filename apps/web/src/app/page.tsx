import SignupGuestBtn from "@/features/auth/components/SignupGuestBtn";
import { Button } from "@/shared/ui/Button";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import Link from "next/link";
import Image from "next/image";
import icon from "./icon.png";

const IconBoard = ICONS_MAP.board;
const IconList = ICONS_MAP.list;
const IconCalendar = ICONS_MAP.calendar;
const IconDashboard = ICONS_MAP.dashboard;
const IconTable = ICONS_MAP.addColumn;
const IconHome = ICONS_MAP.home;
const IconSetting = ICONS_MAP.setting;
const IconPaintBrush = ICONS_MAP.paintBrush;
const IconBullseye = ICONS_MAP.bullEye;

const VIEWS = [
  {
    Icon: IconBoard,
    title: "Board View",
    desc: "Drag-and-drop Kanban boards to visualize task flow across statuses.",
  },
  {
    Icon: IconList,
    title: "List View",
    desc: "A structured overview of every task, grouped and sorted your way.",
  },
  {
    Icon: IconCalendar,
    title: "Calendar View",
    desc: "See deadlines and schedules at a glance on an interactive calendar.",
  },
  {
    Icon: IconTable,
    title: "Table View",
    desc: "Spreadsheet-style rows and columns for quick bulk editing and data overview.",
  },
  {
    Icon: IconDashboard,
    title: "Dashboard",
    desc: "Priority charts and analytics to keep your team on track.",
  },
];

const FEATURES = [
  {
    Icon: IconHome,
    title: "Workspaces",
    desc: "Create dedicated workspaces with custom avatars to organize every team and project.",
  },
  {
    Icon: IconList,
    title: "Lists & Tasks",
    desc: "Break work into lists and tasks with priorities, dates, and assignees.",
  },
  {
    Icon: IconSetting,
    title: "Custom Status Groups",
    desc: "Define your own statuses with colors and icons — adapt the workflow to your process.",
  },
  {
    Icon: IconPaintBrush,
    title: "Whiteboard",
    desc: "Brainstorm and visualize ideas on a freeform collaborative canvas.",
  },
];

function Page() {
  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-gray-50">
      <nav className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-2">
          <Image src={icon} alt="Click Up logo" width={30} height={30} />
          <span className="text-xl font-extrabold tracking-tight text-gray-800">
            Click Up
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button
              type="secondary"
              size="medium"
              ariaLabel="login button"
              buttonFor="button"
            >
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              type="colored"
              size="medium"
              ariaLabel="sign up button"
              buttonFor="button"
            >
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>

      <section className="relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -top-12 -left-12 h-72 w-72 rounded-full border border-white/7" />
          <div className="absolute right-20 bottom-10 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full border border-white/6" />
          <div className="absolute top-1/3 left-1/2 h-32 w-32 rounded-full bg-white/5" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-6 pt-20 pb-28 text-center md:pt-28 md:pb-36">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-indigo-100 backdrop-blur-sm">
            <IconBullseye className="size-3.5" />
            Your productivity, reimagined
          </span>

          <h1 className="max-w-3xl text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Manage your workspaces
            <br />
            <span className="text-indigo-200">all in one place.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed font-medium text-indigo-100/80 sm:text-xl">
            Workspaces, Lists, Tasks, Boards, Calendars, Dashboards &mdash;
            everything your team needs to ship faster.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                type="primary"
                size="large"
                ariaLabel="get started button"
                buttonFor="button"
                extraClasses="shadow-lg shadow-black/20 !bg-white !text-indigo-700 hover:!bg-indigo-50"
              >
                Get Started — Free
              </Button>
            </Link>
            <SignupGuestBtn />
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
            Multiple views,{" "}
            <span className="text-indigo-600">one powerful workflow</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-500">
            Switch between Board, List, Table, Calendar, and Dashboard views —
            see your work the way that makes sense to you.
          </p>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {VIEWS.map((v) => (
              <div
                key={v.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-100/40"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <v.Icon className="size-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-white px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
            Built for teams that{" "}
            <span className="text-indigo-600">move fast</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-500">
            Organize, customize, and collaborate — all from one platform.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <f.Icon className="size-5" />
                </div>
                <div>
                  <h3 className="mb-1 text-base font-bold text-gray-800">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 md:px-16">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 px-8 py-14 text-center shadow-xl shadow-indigo-200/40">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full border border-white/7" />
          </div>

          <h2 className="relative z-10 text-3xl font-bold text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="relative z-10 mt-3 max-w-md text-indigo-100/80">
            Join teams already using Click Up to organize their work and boost
            productivity.
          </p>
          <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                type="primary"
                size="large"
                ariaLabel="sign up now button"
                buttonFor="button"
                extraClasses="!bg-white !text-indigo-700 hover:!bg-indigo-50 shadow-lg shadow-black/10"
              >
                Sign Up Now
              </Button>
            </Link>
            <Link href="/login">
              <Button
                type="secondary"
                size="large"
                ariaLabel="login button"
                buttonFor="button"
                extraClasses="!bg-transparent !border-white/30 !text-white hover:!bg-white/10"
              >
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-8 py-8 md:px-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image src={icon} alt="Click Up logo" width={20} height={20} />
            <span className="text-sm font-bold text-gray-400">Click Up</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 Click Up &mdash; Built with passion.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Page;
