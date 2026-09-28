import { ICONS_MAP } from "@/shared/icons/icons-map";
import Link from "next/link";
import "@/styles/globals.css";
import { Metadata } from "next";
import { Button } from "@/shared/ui/Button";

export const metadata: Metadata = {
  title: "Not Found",
};

function GlobalNotFound() {
  return (
    <html>
      <body>
        <div className="flex h-screen w-screen items-center justify-center bg-neutral-900">
          <div className="flex max-w-96 flex-col items-center gap-4 rounded-xl bg-neutral-800 px-6 py-8">
            <div className="mb-4 w-fit rounded-xl bg-indigo-600/20 p-2 ring-2 ring-indigo-600 ring-offset-4 ring-offset-neutral-800">
              <ICONS_MAP.noRoute className="size-8 fill-indigo-600 text-indigo-600" />
            </div>

            <h2 className="text-xl font-semibold text-neutral-200">
              Page not found
            </h2>
            <p className="text-center text-base font-medium text-neutral-400">
              The page you&apos;re looking for doesn&apos;t exist or the URL may
              be incorrect.
            </p>
            <Link href="/home/lists" className="w-full">
              <Button
                stretch={true}
                type="colored"
                size="large"
                ariaLabel="go to lists overview page"
              >
                Go to home
              </Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

export default GlobalNotFound;
