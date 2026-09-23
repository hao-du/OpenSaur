import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTag } from "../api/tagsApi";
import type { SaveTagDto } from "../dtos/TagDto";

export function useCreateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveTagDto) => createTag(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
        queryClient.invalidateQueries({ queryKey: ["marker-tags"] }),
      ]);
    },
  });
}
