import { ConfigDto } from "../../../infrastructure/config/dtos/ConfigDto";
import { CallbackResultDto } from "../dtos/CallbackResultDto";
import { getPkceSession, savePkceSession } from "../storages/pkceStorage";

export async function buildAuthorizeUrl(
  config: ConfigDto,
): Promise<string> {
  const pkceSession = await savePkceSession();
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

export function readCallbackResult(search: string): CallbackResultDto {
  const searchParams = new URLSearchParams(search);
  const pkceSession = getPkceSession();
  const returnedState = searchParams.get("state");
  const storedState = pkceSession?.state ?? null;

  return {
    code: searchParams.get("code"),
    error: searchParams.get("error"),
    errorDescription: searchParams.get("error_description"),
    hasPkceSession: pkceSession != null,
    returnedState,
    stateMatches:
      returnedState == null || storedState == null
        ? null
        : returnedState === storedState,
    storedState,
  };
}
