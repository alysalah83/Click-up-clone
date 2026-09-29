import axios, { AxiosRequestConfig } from "axios";
import { cookies } from "next/headers";
import { ApiError } from "../errors";
import { UnwrappedAxiosInstance } from "./types";

function toApiError(error: any): ApiError {
  if (error.response) {
    const message = error.response.data?.error?.message || "Something went wrong";
    const statusCode = error.response.status;
    return new ApiError(message, statusCode);
  } else if (error.request) return new ApiError("Network error. Check your connection.", 0);
  return new ApiError(error.message || "Something went wrong", 500);
}

/** Base axios instance for the server, with no response interceptor, so callers can read headers. */
async function createRawServerAxios() {
  const cookiesStore = await cookies();
  const allCookies = cookiesStore.toString();

  return axios.create({
    baseURL: process.env.API_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Cookie: allCookies,
    },
  });
}

export const createServerAxios = async (): Promise<UnwrappedAxiosInstance> => {
  const instance = await createRawServerAxios();

  instance.interceptors.response.use(
    (response) => {
      return response.data;
    },
    (error) => {
      throw toApiError(error);
    },
  );

  return instance as UnwrappedAxiosInstance;
};

/**
 * Like `createServerAxios().get`, but bypasses the data-unwrap interceptor so the
 * response headers (e.g. `X-Next-Cursor`) are readable. Used for paginated endpoints.
 */
export async function getWithHeaders<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<{ data: T; nextCursor: string | null }> {
  const instance = await createRawServerAxios();
  try {
    const response = await instance.get<T>(url, config);
    return { data: response.data, nextCursor: response.headers["x-next-cursor"] ?? null };
  } catch (error) {
    throw toApiError(error);
  }
}
