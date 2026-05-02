import { ConfigDto } from "../../../infrastructure/config/dtos/ConfigDto";
import { client } from "../../../infrastructure/http/client";
import { AuthSessionDto } from "../dtos/AuthSessionDto";
import { TokenResponseDto } from "../dtos/TokenResponseDto";

const authRequestTimeoutMs = 20_000;

export async function exchangeAuthCode(
  config: ConfigDto,
  code: string,
  codeVerifier: string
): Promise<AuthSessionDto> {
  const endpoint = new URL("/auth/exchange", config.authority).toString();
  const tokenResponse = await client.post<TokenResponseDto>(
    endpoint,
    {
      clientId: config.clientId,
      code,
      codeVerifier,
      redirectUri: config.redirectUri
    },
    {
      timeout: authRequestTimeoutMs,
      withCredentials: true,
      skipAuth: true
    }
  );

  return createAuthSession(tokenResponse);
}

export async function refreshAuthSession(config: ConfigDto): Promise<AuthSessionDto> {
  const endpoint = new URL("/auth/refresh", config.authority).toString();
  const tokenResponse = await client.post<TokenResponseDto>(
    endpoint,
    {
      clientId: config.clientId
    },
    {
      timeout: authRequestTimeoutMs,
      withCredentials: true,
      skipAuth: true
    }
  );

  return createAuthSession(tokenResponse);
}

function createAuthSession(tokenResponse: TokenResponseDto): AuthSessionDto {
  return {
    accessToken: tokenResponse.accessToken,
    expiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString(),
    idToken: tokenResponse.idToken,
    scope: tokenResponse.scope,
    tokenType: tokenResponse.tokenType
  };
}
