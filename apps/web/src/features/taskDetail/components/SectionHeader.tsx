import type { ReactNode } from "react";

function SectionHeader({
  title,
  count,
  children,
}: {
  title: string;
  count?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3">
      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
        {title}
      </h3>
      {count && <span className="text-xs text-neutral-500">{count}</span>}
      {children}
    </header>
  );
}

export default SectionHeader;
