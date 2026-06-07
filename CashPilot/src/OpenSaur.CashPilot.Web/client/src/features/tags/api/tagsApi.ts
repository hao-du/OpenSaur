import { client } from "../../../infrastructure/http/client";
import type { SaveTagDto, TagDto } from "../dtos/TagDto";

export type TagFilterParams = {
  isActive: boolean;
  name: string;
};

export async function getTags(filters: TagFilterParams) {
  return client.get<TagDto[]>("/api/tags", {
    params: {
      isActive: filters.isActive,
      name: filters.name.trim().length > 0 ? filters.name.trim() : undefined
    }
  });
}

export async function createTag(payload: SaveTagDto) {
  return client.post<TagDto, SaveTagDto>("/api/tags", payload);
}

export async function updateTag(id: string, payload: SaveTagDto) {
  return client.put<TagDto, SaveTagDto>(`/api/tags/${id}`, payload);
}

export async function deleteTag(id: string) {
  await client.delete<void>(`/api/tags/${id}`);
}
