"use server";

import { authServices } from "../services/auth.service";
import { formatActionError } from "@/shared/lib/utils/formatActionError";
import { ActionResponse } from "@/shared/types/action.types";

export async function updateUser(fields: {
  hasOnBoarded: boolean;
}): Promise<ActionResponse> {
  try {
    await authServices.updateUser(fields.hasOnBoarded);
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: formatActionError(error) };
  }
}
