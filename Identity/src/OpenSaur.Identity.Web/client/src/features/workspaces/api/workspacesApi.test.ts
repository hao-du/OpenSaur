import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkspace } from "./workspacesApi";

const postMock = vi.fn();

vi.mock("../../../shared/api/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: (...args: unknown[]) => postMock(...args),
    put: vi.fn()
  }
}));

describe("createWorkspace", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "test-idempotency-key")
    });
    postMock.mockResolvedValue({
      data: {
        data: {
          id: "workspace-1"
        },
        errors: [],
        success: true
      }
    });
  });

  it("opts the create request into idempotency handling", async () => {
    await createWorkspace({
      description: "Primary staff workspace",
      name: "Operations"
    });

    expect(postMock).toHaveBeenCalledWith(
      "/api/workspace/create",
      {
        description: "Primary staff workspace",
        name: "Operations"
      },
      {
        idempotent: true
      }
    );
  });
});
