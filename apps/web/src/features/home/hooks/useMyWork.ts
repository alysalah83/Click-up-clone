import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { MyWorkTask } from "../types";

export function useMyWork() {
  const tz = -new Date().getTimezoneOffset();
  return useQuery({
    queryKey: ["my-work", tz],
    queryFn: () => axiosClient.get<MyWorkTask[]>(`/api/my-work?tz=${tz}`),
    refetchOnWindowFocus: true,
  });
}
