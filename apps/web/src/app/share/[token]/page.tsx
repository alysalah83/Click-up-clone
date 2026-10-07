import { cache } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import axios from "axios";
import { Link2Off } from "lucide-react";
import { clientIp } from "@/shared/lib/publicApiProxy";
import ShareTopBar from "@/features/share/components/ShareTopBar";
import PublicListView from "@/features/share/components/PublicListView";
import PublicDocView from "@/features/share/components/PublicDocView";
import type { PublicShare } from "@/features/share/types";

type Props = { params: Promise<{ token: string }> };

/**
 * Public, no login: the proxy matcher does not cover /share. No cookies are sent to the API.
 * Null for unknown, turned-off or reset links. Cached per request, so metadata and the page
 * share one call (one counted view).
 */
const getShare = cache(async (token: string): Promise<PublicShare | null> => {
  try {
    const res = await axios.get<PublicShare>(`${process.env.API_URL}/public/share/${encodeURIComponent(token)}`, {
      headers: { "X-Client-Ip": clientIp(await headers()) },
    });
    return res.data;
  } catch {
    return null;
  }
});

const titleOf = (share: PublicShare) => (share.resourceType === "list" ? share.name : share.title.trim() || "Untitled");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const share = await getShare((await params).token);
  return share
    ? {
        title: titleOf(share),
        description: `A read-only ${share.resourceType} shared from ${share.spaceName} on ClickUp clone.`,
        robots: { index: false, follow: false },
      }
    : { title: "Link not active", robots: { index: false, follow: false } };
}

function LinkInactive() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <section className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-center shadow-xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
        <div className="h-16 bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="flex flex-col items-center gap-3 px-6 py-10">
          <span className="-mt-16 flex size-14 items-center justify-center rounded-full bg-white text-violet-600 shadow-md ring-4 ring-white dark:bg-neutral-800 dark:ring-neutral-900">
            <Link2Off className="size-6" />
          </span>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">This link is no longer active</h2>
          <p className="max-w-sm text-sm text-neutral-500">
            The owner turned sharing off or created a new link. Ask them for the current one.
          </p>
          <Link
            href="/login"
            className="mt-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Try the live demo
          </Link>
        </div>
      </section>
    </div>
  );
}

async function SharePage({ params }: Props) {
  const { token } = await params;
  const share = await getShare(token);

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <ShareTopBar
        title={share ? titleOf(share) : undefined}
        subtitle={share ? `${share.spaceName} · ${share.resourceType === "list" ? "List" : "Doc"}` : undefined}
      />
      <main className="flex flex-1 flex-col">
        {!share ? (
          <LinkInactive />
        ) : share.resourceType === "list" ? (
          <PublicListView token={token} list={share} />
        ) : (
          <PublicDocView token={token} doc={share} />
        )}
      </main>
    </div>
  );
}

export default SharePage;
