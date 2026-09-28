import { List } from "../types";
import ControlledInput from "@/shared/ui/Input/ControlledInput";

function CreateListStep({
  data,
  onChange,
  onBlur,
}: {
  data: {
    name: List["name"];
  };
  onChange: (fields: Record<string, unknown>) => void;
  onBlur: () => void;
}) {
  const { name } = data;
  return (
    <div className="flex max-w-80 flex-col gap-5 p-6 text-neutral-700 lg:max-w-lg lg:min-w-lg dark:text-neutral-500">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Create a List
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          All Lists are located within a Space. Lists can house any type of
          task.
        </p>
      </header>
      <hr className="border-neutral-200 dark:border-neutral-700" />
      <main className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          name
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-full">
            <ControlledInput
              name="name"
              type="text"
              placeholder="Enter List name"
              value={name}
              onChange={(e) => onChange({ name: e.target.value })}
              onBlur={onBlur}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateListStep;
