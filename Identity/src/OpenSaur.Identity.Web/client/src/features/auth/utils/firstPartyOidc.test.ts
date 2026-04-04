import { describe, expect, it } from "vitest";
import { buildFirstPartyAuthorizeUrl } from "./firstPartyOidc";

describe("firstPartyOidc", () => {
  it("builds the first-party authorize url for the configured issuer and callback", () => {
    const authorizeUrl = buildFirstPartyAuthorizeUrl({
      state: "state-123"
    });

    expect(authorizeUrl).toContain("https://app.duchihao.com/identity/connect/authorize");
    expect(authorizeUrl).toContain("client_id=first-party-web");
    expect(authorizeUrl).toContain("redirect_uri=https%3A%2F%2Fapp.duchihao.com%2Fidentity%2Fauth%2Fcallback");
    expect(authorizeUrl).toContain("response_type=code");
    expect(authorizeUrl).toContain("scope=openid+profile+email+roles+offline_access+api");
    expect(authorizeUrl).toContain("state=state-123");
  });
});
