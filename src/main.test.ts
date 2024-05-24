import * as _fs from "fs";
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  promises: {
    access: jest.fn(),
  },
}));

import * as core from "@actions/core";
jest.mock("@actions/core");

import {
  getRef,
  getAllReleases,
  isDuplicateRelease,
  getGithubData,
  createOrUpdateTag,
  createRelease,
  GithubRef,
} from "./github";
jest.mock("./github", () => {
  const originalModule = jest.requireActual("./github");
  const mockedModule = jest.createMockFromModule<typeof originalModule>("./github");
  return {
    ...mockedModule,
    isSemVerBump: originalModule.isSemVerBump,
    getGithubData: jest.fn().mockResolvedValue({
      releases: [],
      patch: { number: "1.0.0", ref: undefined },
      major: { number: "1", ref: undefined },
      minor: { number: "1.0", ref: undefined },
      nextMinor: { number: "1.1", ref: undefined },
    }),
  };
});

import { validateInputs, validateGithubState, DuplicateReleaseError } from "./validate";
jest.mock("./validate");

import { run } from "./main";

describe("main", () => {
  describe("run", () => {
    const originalEnv = { ...process.env };

    const mockCoreInfo = core.info as jest.MockedFunction<typeof core.info>;
    const mockCoreSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>;
    const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;
    const mockGetBooleanInput = core.getBooleanInput as jest.MockedFunction<
      typeof core.getBooleanInput
    >;

    const mockGetRef = getRef as jest.MockedFunction<typeof getRef>;
    const mockGetAllReleases = getAllReleases as jest.MockedFunction<typeof getAllReleases>;
    const mockIsDuplicateRelease = isDuplicateRelease as jest.MockedFunction<
      typeof isDuplicateRelease
    >;
    const mockGetGithubData = getGithubData as jest.MockedFunction<typeof getGithubData>;
    const mockCreateOrUpdateTag = createOrUpdateTag as jest.MockedFunction<
      typeof createOrUpdateTag
    >;
    const mockCreateRelease = createRelease as jest.MockedFunction<typeof createRelease>;

    const mockValidateInputs = validateInputs as jest.MockedFunction<typeof validateInputs>;
    const mockValidateGithubState = validateGithubState as jest.MockedFunction<
      typeof validateGithubState
    >;
    beforeEach(() => {
      process.env.GITHUB_SHA = "fake-sha";

      jest.useFakeTimers();

      mockGetBooleanInput.mockReturnValue(false);
      mockGetRef.mockResolvedValue(undefined);
      mockGetAllReleases.mockResolvedValue([]);
      mockGetInput
        .mockReturnValueOnce("1.0.0")
        .mockReturnValueOnce("files")
        .mockReturnValueOnce("body");

      mockIsDuplicateRelease.mockReturnValue(false);
    });

    afterEach(() => {
      process.env = { ...originalEnv };
      jest.clearAllMocks();
    });

    it("should call core.info if it is a duplicate release", async () => {
      mockValidateGithubState.mockImplementationOnce(() => {
        throw new DuplicateReleaseError(
          "Release 1.0.0 already exists for this sha. Exiting without creating a release.",
        );
      });
      await run();

      expect(mockCoreInfo).toHaveBeenCalled();
      expect(mockValidateInputs).toHaveBeenCalled();
      expect(mockValidateGithubState).toHaveBeenCalled();
    });

    it("should call validateInputs correctly", async () => {
      await run();

      expect(mockValidateInputs).toHaveBeenCalledWith({
        body: "body",
        files: ["files"],
        validateOnly: false,
        sha: "fake-sha",
        versionNumber: "1.0.0",
      });
    });

    it("should call getGithubData correctly", async () => {
      await run();

      expect(mockGetGithubData).toHaveBeenCalledWith("1.0.0");
    });

    it("should call validateGithubState correctly", async () => {
      await run();

      expect(mockValidateGithubState).toHaveBeenCalledWith({
        patch: { number: "1.0.0", ref: undefined },
        major: { number: "1", ref: undefined },
        minor: { number: "1.0", ref: undefined },
        nextMinor: { number: "1.1", ref: undefined },
        body: "body",
        files: ["files"],
        releases: [],
        sha: "fake-sha",
        validateOnly: false,
        versionNumber: "1.0.0",
      });
    });

    it("should call core.setFailed when validateGithubState throws an error", async () => {
      mockValidateGithubState.mockImplementationOnce(() => {
        throw new Error("failed message");
      });

      await run();

      expect(mockCoreSetFailed).toHaveBeenCalledWith("failed message");
    });

    it("should call core.setFailed when validateInputs throws an error", async () => {
      mockValidateInputs.mockImplementationOnce(() => {
        throw new Error("failed message");
      });

      await run();

      expect(mockCoreSetFailed).toHaveBeenCalledWith("failed message");
    });

    it("should call core.info and return when validateOnly is true", async () => {
      mockGetBooleanInput.mockReturnValueOnce(true);

      await run();

      expect(mockCoreInfo).toHaveBeenCalledWith(
        "Validation successful. Exiting without creating a release.",
      );
    });

    it("should call core.info and return when validateOnly is true", async () => {
      mockGetBooleanInput.mockReturnValueOnce(true);

      await run();

      expect(mockCoreInfo).toHaveBeenCalledWith(
        "Validation successful. Exiting without creating a release.",
      );
      expect(mockCreateOrUpdateTag).not.toHaveBeenCalled();
      expect(mockCoreSetFailed).not.toHaveBeenCalled();
    });

    it("should call mockCreateOrUpdateTag for patch version", async () => {
      await run();

      expect(mockCreateOrUpdateTag).toHaveBeenCalledWith({ number: "1.0.0" }, "fake-sha");
    });

    it("should call createRelease for patch version", async () => {
      await run();

      expect(mockCreateRelease).toHaveBeenCalledWith({ number: "1.0.0" }, ["files"], "body");
    });

    it("should call mockCreateOrUpdateTag for minor version", async () => {
      await run();
      expect(mockCreateOrUpdateTag).toHaveBeenCalledWith({ number: "1.0" }, "fake-sha");
    });

    it("should call mockCreateOrUpdateTag for major version if nextMinor tag does not exist", async () => {
      await run();
      expect(mockCreateOrUpdateTag).toHaveBeenCalledWith({ number: "1" }, "fake-sha");
    });

    it("should not call mockCreateOrUpdateTag for major version if nextMinor tag exists", async () => {
      mockGetGithubData.mockResolvedValue({
        releases: [],
        patch: { name: "v1.0.0", number: "1.0.0", ref: undefined },
        major: { name: "v1", number: "1", ref: undefined },
        minor: { name: "v1.0", number: "1.0", ref: undefined },
        nextMinor: { name: "v1.1", number: "1.1", ref: {} as GithubRef },
      });

      await run();
      expect(mockCreateOrUpdateTag).not.toHaveBeenCalledWith({ number: "1" }, "fake-sha");
    });
  });
});
