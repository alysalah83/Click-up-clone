import { use } from "react";
import { UserWithoutPassword } from "../types";
import { ButtonLink } from "@/shared/ui/Button";

function UserLogo({
  userPromise,
}: {
  userPromise: Promise<UserWithoutPassword | undefined>;
}) {
  const user = use(userPromise);
  if (!user) return null;
  if (user.role === "guest")
    return (
      <ButtonLink
        href="/signup"
        type="colored"
        size="small"
        rounded="full"
        ariaLabel="sign up to save your work"
        extraClasses="ml-2 normal-case"
      >
        Sign up to save your work
      </ButtonLink>
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
