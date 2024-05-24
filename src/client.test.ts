import { getToken, getOctokit } from "./client";
jest.mock("@actions/github", () => ({
  getOctokit: jest.fn().mockReturnValue({ faked: "octokit" }),
}));

describe("client", () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    process.env.GITHUB_ACTION = "fake-action";
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getToken", () => {
    it("should return the token fro GITHUB_TOKEN", async () => {
      process.env.GITHUB_TOKEN = "my-fake-token";
      expect(getToken()).resolves.toBe("my-fake-token");
    });

    it("should return the token fro INPUT_GITHUB_TOKEN", async () => {
      process.env.INPUT_GITHUB_TOKEN = "my-fake-token";
      expect(getToken()).resolves.toBe("my-fake-token");
    });

    it("should return the token fro INPUT_TOKEN", async () => {
      process.env.INPUT_TOKEN = "my-fake-token";
      expect(getToken()).resolves.toBe("my-fake-token");
    });
  });

  describe("getOctokit", () => {
    it("should call getOctokit", async () => {
      process.env.GITHUB_TOKEN = "my-fake-token";
      await getOctokit();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      expect(require("@actions/github").getOctokit).toHaveBeenCalled();
    });
    it("should return the octokit instance", async () => {
      process.env.GITHUB_TOKEN = "my-fake-token";
      const octokit = await getOctokit();
      expect(octokit).toEqual({ faked: "octokit" });
    });
  });
});
