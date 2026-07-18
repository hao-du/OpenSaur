import { useQuery } from "@tanstack/react-query";
import { getTags, type TagFilterParams } from "../api/tagsApi";

type UseTagsQueryOptions = {
  enabled?: boolean;
};

export function useTagsQuery(filters: TagFilterParams, options?: UseTagsQueryOptions) {
  return useQuery({
    queryFn: () => getTags(filters),
    queryKey: ["tags", filters],
    enabled: options?.enabled,
  });
}
