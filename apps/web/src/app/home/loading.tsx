import MiniSpinner from "@/shared/ui/MiniSpinner";

function loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <MiniSpinner width="xLarge" />
    </div>
  );
}

export default loading;
