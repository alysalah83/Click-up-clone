import { createServerAxios } from "@/shared/lib/axios/server";
import type { DashboardSummary } from "./types";

export async function getDashboardSummary() {
  const serverAxios = await createServerAxios();
  return await serverAxios.get<DashboardSummary>("/dashboard/summary");
}
