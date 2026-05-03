import { client } from "../../../infrastructure/http/client";
import type { SettingsDto } from "../dtos/SettingsDto";

export async function getSettings() {
  return client.get<SettingsDto>("/api/settings");
}
