interface ErrorResponse {
  message: string;
  errors?: Record<string, string>;
}

interface ActionErrorResponse {
  status: "error";
  error: ErrorResponse;
}

type ActionResponse<T = any> =
  | { status: "idle" }
  | { status: "success" }
  | { status: "success"; payload: T }
  | ActionErrorResponse;

export type { ActionResponse, ActionErrorResponse, ErrorResponse };
