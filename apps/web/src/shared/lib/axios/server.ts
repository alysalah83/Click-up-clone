import axios from "axios";
import { cookies } from "next/headers";
import { ApiError } from "../errors";
import { UnwrappedAxiosInstance } from "./types";

export const createServerAxios = async (): Promise<UnwrappedAxiosInstance> => {
  const cookiesStore = await cookies();
  const allCookies = cookiesStore.toString();

  const instance = axios.create({
    baseURL: process.env.API_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Cookie: allCookies,
    },
  });

  instance.interceptors.response.use(
    (response) => {
      return response.data;
    },
    (error) => {
      if (error.response) {
        const message =
          error.response.data?.error?.message || "Something went wrong";
        const statusCode = error.response.status;
        throw new ApiError(message, statusCode);
      } else if (error.request)
        throw new ApiError("Network error. Check your connection.", 0);
      else throw new ApiError(error.message || "Something went wrong", 500);
    },
  );

  return instance as UnwrappedAxiosInstance;
};
