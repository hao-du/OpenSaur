import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTemplate } from "../api/templatesApi";
import type { UpsertTemplateRequestDto } from "../dtos/TemplateDto";

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertTemplateRequestDto) => createTemplate(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
