import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTemplate } from "../api/templatesApi";

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
