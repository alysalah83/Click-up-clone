import Link from "next/link";
import { ReactNode } from "react";
import { ButtonClassOptions, getButtonClasses } from "./buttonClasses";

interface ButtonLinkProps extends ButtonClassOptions {
  href: string;
  children: ReactNode;
  ariaLabel: string;
}

/** A Next Link styled as a Button, so we never nest a <button> inside an <a>. */
function ButtonLink({
  href,
  children,
  ariaLabel,
  ...classOptions
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={getButtonClasses({
        ...classOptions,
        extraClasses: `${classOptions.stretch ? "" : "inline-block text-center"} ${classOptions.extraClasses ?? ""}`,
      })}
    >
      {children}
    </Link>
  );
}

export default ButtonLink;
