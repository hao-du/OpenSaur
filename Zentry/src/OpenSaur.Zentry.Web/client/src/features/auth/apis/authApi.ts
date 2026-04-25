import axios from "axios";
import { ConfigDto } from "../../../infrastructure/config/dtos/ConfigDto";
import { AuthSessionDto } from "../dtos/AuthSessionDto";
import { TokenResponseDto } from "../dtos/TokenResponseDto";

const authRequestTimeoutMs = 20_000;

export async function exchangeAuthCode(
  config: ConfigDto,
  code: string,
  codeVerifier: string
): Promise<AuthSessionDto> {
  const endpoint = new URL("/auth/exchange", config.authority).toString();
  const response = await axios.post<TokenResponseDto>(
    endpoint,
    {
      clientId: config.clientId,
      code,
      codeVerifier,
      redirectUri: config.redirectUri
    },
    {
      timeout: authRequestTimeoutMs,
      withCredentials: true
    }
  );

  return createAuthSession(response.data);
}

export async function refreshAuthSession(config: ConfigDto): Promise<AuthSessionDto> {
  const endpoint = new URL("/auth/refresh", config.authority).toString();
  const response = await axios.post<TokenResponseDto>(
    endpoint,
    {
      clientId: config.clientId
    },
    {
      timeout: authRequestTimeoutMs,
      withCredentials: true
    }
  );

  return createAuthSession(response.data);
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
