import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "../api/templatesApi";
import type { TemplateFilterParams } from "../dtos/TemplateDto";

export function useTemplatesQuery(filters: TemplateFilterParams) {
  return useQuery({
    queryFn: () => getTemplates(filters),
    queryKey: ["templates", filters]
  });
}

