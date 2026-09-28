interface SkeltonLoaderProps {
  height?: `h-${number | string}`;
  width?: `w-${number | string}`;
  count?: number;
  rounded?: `rounded-${string}`;
  bgColor?: `bg-${string}-${number} dark:bg-${string}-${number}`;
}

function SkeletonLoader({
  height = "h-2",
  width = "w-full",
  count = 1,
  rounded = "rounded-lg",
  bgColor = "bg-neutral-200 dark:bg-neutral-800",
}: SkeltonLoaderProps) {
  const countArr = Array.from({ length: count }, (_, i: number) => i);
  return (
    <>
      {countArr.map((index: number) => (
        <div
          className={`relative ${height} ${width} overflow-hidden ${rounded} ${bgColor}`}
          key={`skelton-number-${index}`}
        >
          <div className="animate-skelton absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-neutral-50 to-transparent dark:via-neutral-200/30" />
        </div>
      ))}
    </>
  );
}

export default SkeletonLoader;
