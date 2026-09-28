import { ICONS_MAP } from "@/shared/icons/icons-map";
import { IconsMap } from "@/shared/icons/icons.type";
import ErrorMessage from "../ErrorMessage/ErrorMessage";

interface FormInputWithLabelProps {
  icon: IconsMap;
  label: string;
  placeholder: string;
  inputType: HTMLInputElement["type"];
  errorMessage: string | undefined;
  disabled?: boolean;
  register?: any;
  autoComplete?: HTMLInputElement["autocomplete"];
}

function FormInputWithLabel({
  icon,
  label,
  placeholder,
  inputType,
  errorMessage,
  register,
  disabled = false,
  autoComplete = "",
}: FormInputWithLabelProps) {
  const Icon = ICONS_MAP[icon];
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={label} className="text-sm font-semibold text-gray-600">
        {label}
      </label>
      <div className="relative">
        <input
          {...register}
          id={label}
          autoComplete={autoComplete}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-xl border bg-gray-50/80 py-2.5 pr-4 pl-10 text-sm text-gray-800 outline-0 transition duration-200 placeholder:text-gray-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 ${errorMessage ? "border-red-400 ring-1 ring-red-400/30" : "border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"}`}
        />
        <Icon
          className={`absolute top-1/2 left-3.5 size-4 -translate-y-1/2 ${errorMessage ? "text-red-400" : "text-gray-400"}`}
        />
      </div>
      {errorMessage && <ErrorMessage error={errorMessage} />}
    </div>
  );
}

export default FormInputWithLabel;
