function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <span
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"
    >
      <span
        className={`block h-full rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-primary"}`}
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

export default ProgressBar;
