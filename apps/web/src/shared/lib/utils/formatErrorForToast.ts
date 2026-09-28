import { ErrorResponse } from "@/shared/types/action.types";

export function formatErrorForToast(error: ErrorResponse) {
  return error.errors
    ? Object.entries(error.errors).reduce(
        (acc, [key, value]) =>
          acc +
          `${key.replace(key[0]!, key[0]!.toUpperCase())}: ${value.replace(":", "")},`,
        "",
      )
    : error.message;
}
