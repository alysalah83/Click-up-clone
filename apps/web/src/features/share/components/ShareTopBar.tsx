import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import logo from "@/../public/logo.png";

/** ClickUp-style bar on public share pages: where it comes from, what it is, and the demo CTA. */
function ShareTopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="ClickUp clone home">
          <Image src={logo} alt="" width={28} height={28} className="size-7" />
          <span className="hidden text-xs text-muted-foreground lg:inline">Shared from ClickUp clone</span>
        </Link>
        {title && (
          <>
            <span aria-hidden className="hidden h-5 w-px bg-neutral-200 sm:block dark:bg-neutral-800" />
            <div className="flex min-w-0 flex-col leading-tight">
              <h1 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</h1>
              {subtitle && <span className="truncate text-[11px] text-muted-foreground">{subtitle}</span>}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              <Lock className="size-3" /> Read-only
            </span>
          </>
        )}
        <Link
          href="/login"
          className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <span className="hidden sm:inline">Try the live demo</span>
          <span className="sm:hidden">Try demo</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </header>
  );
}

export default ShareTopBar;
