import { test } from "vitest";
import { formatErrorForToast } from "./formatErrorForToast";

test("should return a formatted error from error object", () => {
  const error = {
    message: "Validation Failed",
    errors: { name: "Invalid input: expected string, received number" },
  };

  expect(formatErrorForToast(error)).toBe(
    "Name: Invalid input expected string, received number,",
  );
});
