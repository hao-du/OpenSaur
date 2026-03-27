import { describe, expect, it } from "vitest";
import { buildFirstPartyAuthorizeUrl } from "./firstPartyOidc";

describe("firstPartyOidc", () => {
  it("builds the first-party authorize url for the frontend callback", () => {
    const authorizeUrl = buildFirstPartyAuthorizeUrl({
      origin: "http://localhost:5173",
      state: "state-123"
    });

    expect(authorizeUrl).toContain("/connect/authorize");
    expect(authorizeUrl).toContain("client_id=first-party-web");
    expect(authorizeUrl).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fcallback");
    expect(authorizeUrl).toContain("response_type=code");
    expect(authorizeUrl).toContain("scope=openid+profile+email+roles+offline_access+api");
    expect(authorizeUrl).toContain("state=state-123");
  });
});
