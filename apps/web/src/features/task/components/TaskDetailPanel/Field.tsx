function Field({
  label,
  children,
  noBorder = false,
}: {
  label: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[40px] items-center gap-4 ${!noBorder ? "border-b border-neutral-200/60 dark:border-neutral-700/60" : ""}`}
    >
      <span className="w-16 shrink-0 text-xs font-medium tracking-wide text-neutral-400 uppercase">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
export default Field;
