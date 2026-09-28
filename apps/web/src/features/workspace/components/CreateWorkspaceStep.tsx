import { AvatarWithPickerMenu } from "@/shared/ui/AvatarPicker";
import { Workspace } from "../types";
import ControlledInput from "@/shared/ui/Input/ControlledInput";
import { IconsRegistry } from "@/shared/ui/IconPicker/types";
import { AvatarLetters } from "@/shared/ui/AvatarPicker/avatarPicker.types";
import { ColorsToken } from "@/shared/ui/ColorPicker/types";

function CreateWorkspaceStep({
  data,
  onChange,
  onBlur,
}: {
  data: {
    name: Workspace["name"];
    avatar: { icon: AvatarLetters | IconsRegistry; color: ColorsToken };
  };
  onChange: (fields: Record<string, unknown>) => void;
  onBlur: () => void;
}) {
  const {
    name,
    avatar: { color, icon },
  } = data;
  return (
    <div className="flex max-w-80 flex-col gap-5 p-6 text-neutral-700 lg:max-w-lg lg:min-w-lg dark:text-neutral-500">
      <header className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-lime-600 dark:text-lime-400">
          Let&apos;s get you started
        </p>
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Create a Space
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          A Space represents teams, departments, or groups, each with its own
          lists, workflows, and settings.
        </p>
      </header>
      <hr className="border-neutral-200 dark:border-neutral-700" />
      <main className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          icon & name
        </h3>
        <div className="flex items-center gap-3">
          <AvatarWithPickerMenu
            curAvatarIcon={icon}
            selectedIcon={icon.length === 1 ? null : (icon as IconsRegistry)}
            selectedColor={color}
            setSelectedColor={(color) => onChange({ avatar: { color, icon } })}
            setSelectedIcon={(icon) => onChange({ avatar: { color, icon } })}
          />
          <div className="w-full">
            <ControlledInput
              name="name"
              type="text"
              placeholder="Enter workspace name"
              value={name}
              onBlur={onBlur}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateWorkspaceStep;
