import { useQuery } from "@tanstack/react-query";
import { getTags, type TagFilterParams } from "../api/tagsApi";

export function useTagsQuery(filters: TagFilterParams) {
  return useQuery({
    queryFn: () => getTags(filters),
    queryKey: ["tags", filters],
  });
}
