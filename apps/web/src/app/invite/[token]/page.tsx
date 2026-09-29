import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { previewInvite } from "@/features/members/api/members.server";
import AcceptInviteButton from "@/features/members/components/AcceptInviteButton";
import type { InvitePreview } from "@/features/members/types";
import { ApiError } from "@/shared/lib/errors";
import Avatar from "@/shared/ui/AvatarPicker/Avatar";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import MiniSpinner from "@/shared/ui/MiniSpinner";

export const metadata: Metadata = {
  title: "Join workspace",
};

async function isLoggedIn() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return true;
  } catch {
    return false;
  }
}

async function InviteCard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let preview: InvitePreview | null = null;
  let problem = "This invite link is not valid.";
  try {
    preview = await previewInvite(token);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 410) problem = "This invite link has expired.";
  }

  if (!preview)
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-xl font-semibold text-neutral-800">{problem}</h1>
        <p className="text-sm text-neutral-500">Ask a teammate for a new link.</p>
        <Link href="/login" className="text-sm font-medium text-violet-600 hover:underline">
          Go to login
        </Link>
      </div>
    );

  const { workspace, inviter, role } = preview;
  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <Avatar
        avatarColor={workspace.avatar.color as ColorsToken}
        avatarContent={workspace.avatar.icon as IconsRegistry}
        disabled
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm text-neutral-500">
          <span className="font-semibold text-neutral-700">{inviter.name}</span> invited you to join
        </p>
        <h1 className="text-2xl font-bold text-neutral-900">{workspace.name}</h1>
        <p className="text-xs text-neutral-500">
          You will join as <span className="font-medium capitalize">{role}</span>
        </p>
      </div>
      <AcceptInviteButton token={token} isLoggedIn={await isLoggedIn()} />
    </div>
  );
}

function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 px-4">
      <section className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-xl">
        <Link href="/" className="text-lg font-extrabold text-violet-700">
          Click Up
        </Link>
        <Suspense fallback={<MiniSpinner bgColor="bg-neutral-900" width="large" padding="p-1.5" />}>
          <InviteCard params={params} />
        </Suspense>
      </section>
    </main>
  );
}

export default InvitePage;
