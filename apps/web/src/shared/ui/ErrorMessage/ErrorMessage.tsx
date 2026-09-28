import { ICONS_MAP } from "@/shared/icons/icons-map";
import { StylesSizes } from "@/shared/types/index.types";

interface ErrorMessageProps {
  error: string | undefined;
  size?: StylesSizes;
  errorObject?: Record<string, string>;
}

function ErrorMessage({
  error,
  size = "medium",
  errorObject,
}: ErrorMessageProps) {
  if (!error && !errorObject) return null;
  const textSize = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };
  return errorObject && Object.keys(errorObject).length !== 0 ? (
    <div className="flex items-center gap-0.5">
      {Object.entries(errorObject).map(([field, errorMessage]) => (
        <div key={field}>
          <ICONS_MAP.error
            className={`${textSize[size]} size-4 fill-red-600 font-medium text-red-600 dark:fill-red-500 dark:text-red-500`}
          />
          <span
            className={`${textSize[size]} font-medium text-red-600 dark:text-red-500`}
          >
            {field.replace(field[0]!, field[0]!.toUpperCase())} {errorMessage}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <div className="flex items-center gap-0.5">
      <ICONS_MAP.error
        className={`${textSize[size]} size-4 fill-red-600 font-medium text-red-600 dark:fill-red-500 dark:text-red-500`}
      />
      <span
        className={`${textSize[size]} font-medium text-red-600 dark:text-red-500`}
      >
        {error}
      </span>
    </div>
  );
}

export default ErrorMessage;
