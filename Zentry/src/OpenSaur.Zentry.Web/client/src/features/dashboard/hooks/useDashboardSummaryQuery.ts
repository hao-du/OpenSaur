import { useQuery } from "@tanstack/react-query";
import { client } from "../../../infrastructure/http/client";
import type { DashboardSummaryDto } from "../dtos/DashboardSummaryDto";

async function getDashboardSummary() {
  return client.get<DashboardSummaryDto>("/api/dashboard/summary");
}

export function useDashboardSummaryQuery() {
  return useQuery({
    queryFn: getDashboardSummary,
    queryKey: ["dashboard", "summary"]
  });
}
