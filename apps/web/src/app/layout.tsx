import Toaster from "@/shared/ui/Toaster";
import ThemeProvider from "@/contexts/ThemeProvider";
import "@/styles/globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "Click up | %s", default: "Click up" },
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
