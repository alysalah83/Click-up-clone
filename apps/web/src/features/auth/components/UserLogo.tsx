import { use } from "react";
import { UserWithoutPassword } from "../types";
import Link from "next/link";

function UserLogo({
  userPromise,
}: {
  userPromise: Promise<UserWithoutPassword | undefined>;
}) {
  const user = use(userPromise);
  if (!user) return null;
  if (user.role === "guest")
    return (
      <Link href="/signup" className="ml-2">
        <p className="text-xl font-bold tracking-wide text-neutral-700 capitalize underline transition duration-200 hover:text-neutral-500 hover:no-underline active:text-neutral-500 active:no-underline dark:text-neutral-400">
          Sign in
        </p>
      </Link>
    );
  const { name } = user;
  const nameFirstLetters =
    name
      ?.split(" ")
      .map((userName: string) => userName.at(0)?.toUpperCase() ?? "")
      .join("") ?? "user";
  return (
    <div className="flex cursor-default items-center gap-2 rounded-lg px-2 py-1">
      <div className="flex h-6 w-6 items-center justify-center truncate rounded-full bg-lime-300 text-xs font-medium sm:h-8 sm:w-8 sm:text-sm dark:bg-lime-700">
        {nameFirstLetters}
      </div>
      <span className="truncate text-sm font-medium text-neutral-800 capitalize sm:text-base dark:text-neutral-200">
        {name}
      </span>
    </div>
  );
}

export default UserLogo;
