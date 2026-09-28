import axios from "axios";
import { ApiError } from "../errors";
import { UnwrappedAxiosInstance } from "./types";

export const axiosClient: UnwrappedAxiosInstance = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

axiosClient.interceptors.response.use(
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
