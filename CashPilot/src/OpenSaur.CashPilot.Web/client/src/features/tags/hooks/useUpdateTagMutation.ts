import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTag } from "../api/tagsApi";
import type { SaveTagDto } from "../dtos/TagDto";

export function useUpdateTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveTagDto }) => updateTag(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
