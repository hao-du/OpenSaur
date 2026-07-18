import { client } from "../../../infrastructure/http/client";
import type { SettingsDto } from "../dtos/SettingsDto";
import type { UpdateSettingsRequestDto } from "../dtos/UpdateSettingsRequestDto";

export async function getSettings() {
  return client.get<SettingsDto>("/api/settings");
}

export async function updateSettings(request: UpdateSettingsRequestDto) {
  return client.put<SettingsDto, UpdateSettingsRequestDto>("/api/settings", request);
}
