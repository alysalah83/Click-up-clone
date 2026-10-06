import Toaster from "@/shared/ui/Toaster";
import ThemeProvider from "@/contexts/ThemeProvider";
import "@/styles/globals.css";
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://click-up-clone-two.vercel.app";
const TITLE = "ClickUp Clone: boards, timelines, docs and AI in one workspace";
const DESCRIPTION =
  "A full-stack ClickUp-style project management app (Next.js, Express, Prisma, Postgres). Try the live demo in one click: a pre-filled workspace with a team, boards, Gantt timeline, dashboards, automations and Claude AI.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { template: "%s · ClickUp Clone", default: TITLE },
  description: DESCRIPTION,
  applicationName: "ClickUp Clone",
  openGraph: {
    type: "website",
    siteName: "ClickUp Clone",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative h-full w-full overflow-x-hidden text-neutral-900 dark:text-neutral-100">
        <ThemeProvider>
          <Toaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
