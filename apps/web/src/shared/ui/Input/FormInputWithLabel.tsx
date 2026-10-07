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
      <label htmlFor={label} className="text-[13px] font-semibold text-[#3d3d4e]">
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
          className={`w-full rounded-lg border bg-white py-3 pr-4 pl-10 text-[15px] text-[#1f1f2e] outline-0 transition duration-150 placeholder:text-[#9a9aab] disabled:cursor-not-allowed disabled:opacity-60 ${errorMessage ? "border-red-400 ring-1 ring-red-400/30" : "border-[#d9d9e3] hover:border-[#b9b9c8] focus:border-[#7b68ee] focus:ring-2 focus:ring-[#7b68ee]/20"}`}
        />
        <Icon
          className={`absolute top-1/2 left-3.5 size-4 -translate-y-1/2 ${errorMessage ? "text-red-400" : "text-[#9a9aab]"}`}
        />
      </div>
      {errorMessage && <ErrorMessage error={errorMessage} />}
    </div>
  );
}

export default FormInputWithLabel;
