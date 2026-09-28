function MetaItem({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-neutral-400">{label}</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {value}
        </span>
      </div>
    );
  }

  export default MetaItem