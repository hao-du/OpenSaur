import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTemplate } from "../api/templatesApi";
import type { UpsertTemplateRequestDto } from "../dtos/TemplateDto";

export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpsertTemplateRequestDto;
    }) => updateTemplate(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
