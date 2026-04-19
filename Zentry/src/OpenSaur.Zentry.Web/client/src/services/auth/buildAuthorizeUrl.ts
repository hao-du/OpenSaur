import type { RuntimeConfig } from "../../dtos/config/ConfigDto";
import type { createPkceSession } from "./pkce";

type PkceSession = Awaited<ReturnType<typeof createPkceSession>>;

export function buildAuthorizeUrl(config: RuntimeConfig, pkceSession: PkceSession): string {
  const authorizeUrl = new URL("/connect/authorize", config.authority);

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.set("scope", config.scope);
  authorizeUrl.searchParams.set("code_challenge", pkceSession.codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", pkceSession.state);

  return authorizeUrl.toString();
}
