import { ZodError } from "zod";
import { ApiError } from "../errors";
import { ErrorResponse } from "@/shared/types/action.types";

export function formatActionError(error: any) {
  console.error(error);
  let formattedError: ErrorResponse;

  if (error instanceof ZodError) {
    formattedError = {
      message: "Validation Failed",
      errors: error.issues.reduce<Record<string, string>>(
        (obj, curObj) => ({ ...obj, [curObj.path.join(",")]: curObj.message }),
        {},
      ),
    };
    console.log(formattedError);
  } else if (error instanceof ApiError)
    formattedError = { message: error.message };
  else formattedError = { message: "Something went wrong" };

  return formattedError;
}
