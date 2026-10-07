import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import icon from "@/app/icon.png";
import { jakarta } from "@/features/landing/font";

function LogAndSignLayout({
  children,
  page,
}: {
  children: ReactNode;
  page: "login" | "signup";
}) {
  const isLoginPage = page === "login";
  return (
    <div
      className={`${jakarta.className} relative flex min-h-dvh w-full flex-col overflow-hidden bg-white text-[#1f1f2e]`}
    >
      {/* Flat angled band, the way ClickUp frames its auth pages. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-10%] bottom-[-30%] h-[60%] -skew-y-[8deg] bg-[#f3f1ff]"
      />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src={icon} alt="" width={26} height={26} />
          <span className="text-[17px] font-extrabold tracking-tight">
            Click Up
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[#55556a] sm:inline">
            {isLoginPage
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>
          <Link
            href={isLoginPage ? "/signup" : "/login"}
            className="rounded-lg bg-[#7b68ee] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6a57e3]"
          >
            {isLoginPage ? "Sign up" : "Log in"}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <section className="w-full max-w-[440px] rounded-2xl border border-[#ececf2] bg-white px-6 py-8 shadow-[0_12px_40px_-12px_rgba(31,31,46,0.18)] sm:px-10 sm:py-10">
          <h1 className="mb-7 text-center text-[1.75rem] font-extrabold tracking-[-0.02em]">
            {isLoginPage ? "Welcome back!" : "Create your account"}
          </h1>
          {children}
        </section>
      </main>
    </div>
  );
}

export default LogAndSignLayout;
