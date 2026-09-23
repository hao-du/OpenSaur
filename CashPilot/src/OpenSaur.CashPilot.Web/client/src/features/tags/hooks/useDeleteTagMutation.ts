import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTag } from "../api/tagsApi";

export function useDeleteTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
        queryClient.invalidateQueries({ queryKey: ["marker-tags"] }),
      ]);
    },
  });
}
