import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorMessage from "./ErrorMessage";

describe("should display error message or errors", () => {
  it("should render error message", () => {
    const message = "do";

    render(<ErrorMessage error={message} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("should render couple of errors message", () => {
    const error = {
      message: "as",
      errors: {
        name: "req",
        avatar: "true",
      },
    };

    render(<ErrorMessage error={error.message} errorObject={error.errors} />);
    expect(screen.getByText("Name req")).toBeInTheDocument();
    expect(screen.getByText("Avatar true")).toBeInTheDocument();
    expect(screen.queryByText("as")).not.toBeInTheDocument();
  });
});
