import { Avatar } from "@/shared/ui/AvatarPicker";
import ColorsPicker from "@/shared/ui/ColorPicker/ColorsPicker";
import ControlledInput from "@/shared/ui/Input/ControlledInput";
import { Menu, MenuContent, MenuTrigger } from "@/shared/ui/Menu/MenuCompound";
import { Status } from "../types";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";

function AddStatusStep({
  data,
  onChange,
  onBlur,
}: {
  data: {
    name: Status["name"];
    bgColor: ColorsToken;
  };
  onChange: (fields: Record<string, unknown>) => void;
  onBlur: () => void;
}) {
  const { bgColor, name } = data;
  return (
    <div className="flex max-w-80 flex-col gap-5 p-6 text-neutral-700 lg:max-w-lg lg:min-w-lg dark:text-neutral-500">
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          Create a Status group
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          A Status group to add tasks to it.
        </p>
      </header>
      <hr className="border-neutral-200 dark:border-neutral-700" />
      <main className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          Color & Name
        </h3>
        <div className="flex items-center gap-3">
          <Menu menuMargin={16}>
            <MenuTrigger containerClasses="flex justify-center">
              <Avatar avatarColor={bgColor} size="medium" />
            </MenuTrigger>
            <MenuContent>
              <ColorsPicker
                selectedColor={bgColor}
                setSelectedColor={(color) => onChange({ bgColor: color })}
              />
            </MenuContent>
          </Menu>
          <div className="w-full">
            <ControlledInput
              inputStyle="primary"
              name="status name"
              value={name}
              onChange={(e) => onChange({ name: e.target.value })}
              onBlur={onBlur}
              placeholder="Status Name"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AddStatusStep;
