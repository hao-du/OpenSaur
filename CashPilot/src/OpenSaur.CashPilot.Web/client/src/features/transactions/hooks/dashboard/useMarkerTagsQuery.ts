import { useQuery } from "@tanstack/react-query";
import { getMarkerTags } from "../../../tags/api/tagsApi";

export function useMarkerTagsQuery() {
  return useQuery({
    queryFn: () => getMarkerTags(),
    queryKey: ["marker-tags"],
  });
}
