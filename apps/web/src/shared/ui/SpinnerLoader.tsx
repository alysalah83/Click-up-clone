import MiniSpinner from "@/shared/ui/MiniSpinner";

function SpinnerLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <MiniSpinner width="xLarge" />
    </div>
  );
}

export default SpinnerLoader;
