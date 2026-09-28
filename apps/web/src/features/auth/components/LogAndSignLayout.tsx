import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import icon from "@/app/icon.png";
import { Button } from "@/shared/ui/Button";

function LogAndSignLayout({
  children,
  page,
}: {
  children: ReactNode;
  page: "login" | "signup";
}) {
  const isLoginPage = page === "login";
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden">
      <div className="hidden flex-col justify-between bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 lg:flex lg:w-[45%]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -top-10 -left-10 h-60 w-60 rounded-full border border-white/7" />
          <div className="absolute bottom-20 left-32 h-40 w-40 rounded-full border border-white/10" />
          <div className="absolute -right-16 -bottom-16 h-72 w-72 rounded-full border border-white/6" />
          <div className="absolute top-1/2 right-10 h-24 w-24 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10">
          <Link
            className="cursor-pointer text-4xl font-extrabold text-white"
            href="/"
          >
            Click Up
          </Link>
          <p className="mt-2 text-lg font-medium text-indigo-100/70">
            Manage everything in one place
          </p>
        </div>

        <div className="relative z-10">
          <blockquote className="border-l-2 border-white/30 pl-5">
            <p className="text-lg leading-relaxed text-white/90 italic">
              &ldquo;The best way to predict the future is to create it.&rdquo;
            </p>
            <footer className="mt-3 text-sm font-semibold text-indigo-200/70">
              — Peter Drucker
            </footer>
          </blockquote>
        </div>

        <div className="relative z-10 flex gap-6 text-xs font-medium text-indigo-200/50">
          <span>© 2026 Click Up</span>
        </div>
      </div>

      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 py-20 sm:px-6 lg:w-[55%] lg:py-10">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 lg:hidden" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full border border-white/7" />
          <div className="absolute top-1/3 left-10 h-20 w-20 rounded-full bg-white/5" />
        </div>

        <div
          className="absolute inset-0 hidden opacity-[0.03] lg:block"
          style={{
            backgroundImage:
              "radial-gradient(circle, #6366f1 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="absolute top-5 right-5 left-5 z-10 flex items-center justify-between sm:top-7 sm:right-7 sm:left-7">
          <Link href="/" className="flex items-center gap-2 lg:invisible">
            <Image src={icon} alt="Click Up logo" width={26} height={26} />
            <span className="text-lg font-extrabold text-white lg:text-gray-800">
              Click Up
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-white/70 sm:inline lg:text-gray-500">
              {isLoginPage
                ? "Don\u0027t have an account?"
                : "Already have account?"}
            </span>
            <Link href={`/${isLoginPage ? "signup" : "login"}`}>
              <Button
                size="large"
                type="colored"
                buttonFor="button"
                ariaLabel="sign up button"
                extraClasses="shadow-lg shadow-indigo-500/30"
              >
                {isLoginPage ? "sign up" : "login"}
              </Button>
            </Link>
          </div>
        </div>

        <section className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white px-8 py-8 shadow-2xl shadow-black/10 sm:px-10 sm:py-10 lg:border-gray-100 lg:shadow-xl lg:shadow-gray-200/60">
          <h1 className="mb-7 border-b border-gray-100 pb-4 text-center text-2xl font-bold tracking-wide text-gray-800 sm:mb-8 sm:text-3xl">
            {isLoginPage ? "Welcome back!" : "Seconds to sign up!"}
          </h1>
          {children}
        </section>
      </div>
    </div>
  );
}

export default LogAndSignLayout;
