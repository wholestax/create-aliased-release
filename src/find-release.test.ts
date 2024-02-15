import { existsRelease } from "./find-release";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _github from "@actions/github";
jest.mock("@actions/github");
import {
  mockGetReleaseByTag,
  mockListMatchingRefs,
} from "./__mocks__/@actions/github";

import * as authAction from "@octokit/auth-action";
jest.mock("@octokit/auth-action", () => {
  return {
    createActionAuth: jest.fn(() =>
      jest.fn(() => {
        return { token: "my-fake-token" };
      }),
    ),
  };
});

jest.mock("@octokit/auth-action");
describe("find-release", () => {
  describe("getRelease", () => {});
  const mockCreateActionAuth =
    authAction.createActionAuth as jest.MockedFunction<
      typeof authAction.createActionAuth
    >;
  describe("existsRelease", () => {
    const tag = "v1.0.0";

    it("returns true if the release and tag exist", async () => {
      // Mock GitHub API responses
      mockListMatchingRefs.mockResolvedValueOnce({
        data: [{ ref: `refs/tags/${tag}` }],
      });
      mockGetReleaseByTag.mockResolvedValueOnce({ data: { tag_name: tag } });

      await expect(existsRelease(tag)).resolves.toBe(true);
      expect(mockCreateActionAuth).toHaveBeenCalled();
    });

    it("returns false if the tag does not exist", async () => {
      // Mock GitHub API response for a non-existent tag
      mockListMatchingRefs.mockResolvedValueOnce({ data: [] });

      await expect(existsRelease(tag)).resolves.toBe(false);
    });

    it("returns false if the release does not exist for an existing tag", async () => {
      // Mock GitHub API responses
      mockListMatchingRefs.mockResolvedValueOnce({
        data: [{ ref: `refs/tags/${tag}` }],
      });
      mockGetReleaseByTag.mockRejectedValueOnce(new Error("Not Found"));

      await expect(existsRelease(tag)).resolves.toBe(false);
    });
  });
});
