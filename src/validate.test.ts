import { GithubReleaseList, GithubRef } from "./github";

import { DuplicateReleaseError, validateGithubState, validateInputs } from "../src/validate";
import { ActionInputs } from "./main";

describe("validate", () => {
  let releases: GithubReleaseList;
  let sha: string;

  beforeEach(() => {
    releases = [{ tag_name: "v1.0.0" }] as GithubReleaseList;
    sha = "aaa";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("DuplicateReleaseError", () => {
    it('should have the name "DuplicateReleaseError"', () => {
      const error = new DuplicateReleaseError("test");
      expect(error.name).toBe("DuplicateReleaseError");
    });

    it("should have the correct message", () => {
      const error = new DuplicateReleaseError("test");
      expect(error.message).toBe("test");
    });

    it("should extend the Error object", () => {
      const error = new DuplicateReleaseError("test");
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("validateInputs", () => {
    it("should throw an error if the version number is empty string", () => {
      expect(() => validateInputs({ versionNumber: "" } as ActionInputs)).toThrow();
    });

    it("should throw an error if it contains the 'v' prefix", () => {
      expect(() => validateInputs({ versionNumber: "v1.0.0" } as ActionInputs)).toThrow();
    });

    it("should throw an error if it is prefixed with a different letter ", () => {
      expect(() => validateInputs({ versionNumber: "r1.0.0" } as ActionInputs)).toThrow();
    });

    it("should throw error if version includes the prerelease part ", () => {
      expect(() =>
        validateInputs({ versionNumber: "1.0.1-test", sha: "fake-sha", files: [] }),
      ).toThrow(`Prerelease versions are not supported.`);
    });

    it("should throw error if sha is empty", () => {
      expect(() => validateInputs({ versionNumber: "1.0.1", sha: "", files: [] })).toThrow();
    });

    it("should throw an error if files parameter is not an array", () => {
      expect(() =>
        // @ts-expect-error Testing invalid input
        validateInputs({ versionNumber: "1.0.1", sha: "fake-sha", files: "" }),
      ).toThrow();
    });
  });

  describe("validateGithubState", () => {
    it("should NOT throw version is a valid semver bump", () => {
      expect(() =>
        validateGithubState({
          patch: { number: "1.0.1", name: "v1.0.0", ref: undefined },
          releases,
          sha: "fake-sha",
        }),
      ).not.toThrow();
    });

    it("should NOT throw an error if version is a valid initial version", () => {
      expect(() =>
        validateGithubState({
          patch: { number: "0.0.0", name: "v0.0.0", ref: undefined },
          releases: [],
          sha: "fake-sha",
        }),
      ).not.toThrow();
      expect(() =>
        validateGithubState({
          patch: { number: "0.0.1", name: "v0.0.1", ref: undefined },
          releases: [],
          sha: "fake-sha",
        }),
      ).not.toThrow();
      expect(() =>
        validateGithubState({
          patch: { number: "0.1.0", name: "v0.1.0", ref: undefined },
          releases: [],
          sha: "fake-sha",
        }),
      ).not.toThrow();
      expect(() =>
        validateGithubState({
          patch: { number: "1.0.0", name: "v1.0.0", ref: undefined },
          releases: [],
          sha: "fake-sha",
        }),
      ).not.toThrow();
    });

    it("should throw an error if version is not a SemVer bump", () => {
      expect(() =>
        validateGithubState({
          patch: { number: "1.0.2", name: "v1.0.2", ref: undefined },
          releases: [],
          sha,
        }),
      ).toThrow("Version '1.0.2' is not a valid SemVer bump of an existing Release");
    });

    it("should throw if the first release is not a valid initial version", () => {
      expect(() =>
        validateGithubState({
          patch: { number: "0.0.2", name: "v0.0.2", ref: undefined },
          releases: [],
          sha,
        }),
      ).toThrow("Version '0.0.2' is not a valid SemVer bump of an existing Release");
    });

    it("should throw an DuplicateReleaseError if the release number exists with the same sha", () => {
      expect(() =>
        validateGithubState({
          patch: { number: "1.0.0", name: "v1.0.0", ref: { object: { sha } } as GithubRef },
          releases,
          sha,
        }),
      ).toThrowError(DuplicateReleaseError);
    });

    it("should throw an error if the release already exists with a different sha", () => {
      expect(() =>
        validateGithubState({
          patch: { number: "1.0.0", name: "v1.0.0", ref: undefined },
          releases,
          sha,
        }),
      ).toThrow(`Release 1.0.0 already exists for a different commit`);
    });
  });
});
