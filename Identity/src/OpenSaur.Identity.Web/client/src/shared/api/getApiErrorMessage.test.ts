import axios from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./getApiErrorMessage";

describe("getApiErrorMessage", () => {
  it("prefers a translated message for known API error codes", () => {
    const error = new axios.AxiosError(
      "Request failed",
      "400",
      undefined,
      undefined,
      {
        config: {} as never,
        data: {
          errors: [
            {
              code: "auth_invalid_credentials",
              detail: "The supplied credentials are invalid or the account is unavailable.",
              message: "Authentication failed."
            }
          ]
        },
        headers: {},
        status: 400,
        statusText: "Bad Request"
      }
    );

    expect(getApiErrorMessage(error, "Fallback")).toBe("Sign in failed. Check your credentials and try again.");
  });

  it("returns the first API error detail when present", () => {
    const error = new axios.AxiosError(
      "Request failed",
      "400",
      undefined,
      undefined,
      {
        config: {} as never,
        data: {
          errors: [
            {
              code: "unknown_code",
              detail: "Passwords must have at least one non alphanumeric character.",
              message: "Validation failed."
            }
          ]
        },
        headers: {},
        status: 400,
        statusText: "Bad Request"
      }
    );

    expect(getApiErrorMessage(error, "Fallback")).toBe(
      "Passwords must have at least one non alphanumeric character."
    );
  });

  it("falls back when the error is not an API envelope", () => {
    expect(getApiErrorMessage(new Error("boom"), "Fallback")).toBe("Fallback");
  });
});
