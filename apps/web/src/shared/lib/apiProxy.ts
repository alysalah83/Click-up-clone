import { NextResponse } from "next/server";
import { createServerAxios } from "./axios/server";
import { ApiError } from "./errors";
import type { UnwrappedAxiosInstance } from "./axios/types";

/** Runs a backend call with the caller's cookies and returns it as a JSON route response. */
export async function proxy(call: (axios: UnwrappedAxiosInstance) => Promise<unknown>) {
  try {
    return NextResponse.json((await call(await createServerAxios())) ?? { ok: true });
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode || 500 : 500;
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: { message } }, { status });
  }
}
