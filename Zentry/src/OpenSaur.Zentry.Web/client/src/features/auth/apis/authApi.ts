import axios from "axios";
import { ConfigDto } from "../../../infrastructure/config/dtos/ConfigDto";
import { AuthSessionDto } from "../dtos/AuthSessionDto";
import { TokenResponseDto } from "../dtos/TokenResponseDto";

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
      withCredentials: true
    }
  );

  return {
    accessToken: response.data.accessToken,
    expiresAt: new Date(Date.now() + response.data.expiresIn * 1000).toISOString(),
    idToken: response.data.idToken,
    scope: response.data.scope,
    tokenType: response.data.tokenType
  };
}
