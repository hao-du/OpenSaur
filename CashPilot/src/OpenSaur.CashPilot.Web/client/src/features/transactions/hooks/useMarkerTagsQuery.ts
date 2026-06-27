import { useQuery } from "@tanstack/react-query";
import { getMarkerTags } from "../api/transactionsApi";

export function useMarkerTagsQuery() {
  return useQuery({
    queryFn: () => getMarkerTags(),
    queryKey: ["marker-tags"]
  });
}
