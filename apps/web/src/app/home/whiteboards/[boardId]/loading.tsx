import MiniSpinner from "@/shared/ui/MiniSpinner";

function loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <MiniSpinner
        bgColor="bg-neutral-900 dark:bg-neutral-200"
        width="large"
        padding="p-1.5"
      />
    </div>
  );
}

export default loading;
