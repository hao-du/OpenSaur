import { client } from "../../../infrastructure/http/client";
import type { CurrentProfileDto } from "../dtos/CurrentProfileDto";

export async function getCurrentProfile() {
  return client.get<CurrentProfileDto>("/api/profile/current");
}
