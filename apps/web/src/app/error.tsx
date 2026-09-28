"use client";

import { ICONS_MAP } from "@/shared/icons/icons-map";
import { Button } from "@/shared/ui/Button";
import { ApiError } from "@/shared/lib/errors";
import Link from "next/link";

function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);

  const isApiError = error instanceof ApiError;
  const statusCode = isApiError ? error.statusCode : 500;
  const message = error.message || "Something went wrong";

  let title = "An Error Occurred";
  if (statusCode === 404) title = "Not Found";
  else if (statusCode === 401) title = "Unauthorized";
  else if (statusCode >= 500) title = "Server Error";
  else if (statusCode === 0) title = "Network Error";

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-900">
      <div className="flex max-w-96 min-w-82 flex-col items-center gap-4 rounded-xl bg-neutral-800 px-6 py-8">
        <div className="mb-4 w-fit rounded-xl bg-red-600/20 p-2 ring-2 ring-red-600 ring-offset-4 ring-offset-neutral-800">
          <ICONS_MAP.error className="size-8 fill-red-600 text-red-600" />
        </div>

        <h2 className="text-xl font-semibold text-neutral-200">{title}</h2>

        <p className="text-center text-base font-medium text-red-400">
          {message}
        </p>

        {isApiError && (
          <span className="text-sm text-neutral-400">
            Error Code: {statusCode}
          </span>
        )}

        {statusCode === 401 ? (
          <Link href="/login">
            <Button
              stretch={true}
              type="colored"
              size="large"
              ariaLabel="go to login"
            >
              Go to Login
            </Button>
          </Link>
        ) : statusCode === 0 ? (
          <Button
            onClick={() => reset()}
            stretch={true}
            type="colored"
            size="large"
            ariaLabel="retry"
          >
            Check Connection & Retry
          </Button>
        ) : (
          <Button
            onClick={() => reset()}
            stretch={true}
            type="colored"
            size="large"
            ariaLabel="try again"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

export default ErrorPage;
