import * as _fs from "fs";
jest.mock("fs");
import * as _github from "@actions/github";
jest.mock("@actions/github");
import * as _core from "@actions/core";
jest.mock("@actions/core");
import { RequestError } from "@octokit/request-error";

import {
  deleteRef,
  listReleases,
  getRef as octokitGetRef,
  createTag as octokitCreateTag,
  createRef as ockokitCreateRef,
  createRelease as octokitCreateRelease,
  uploadReleaseAsset as octokitUploadReleaseAsset,
} from "./__mocks__/@actions/github";

import * as _authAction from "@octokit/auth-action";
jest.mock("@octokit/auth-action");

import {
  releaseExists,
  isSemVerBump,
  getIncrementType,
  createRelease,
  createOrUpdateTag,
  createTag,
  createTagRef,
  getRef,
  deleteTag,
  GithubReleaseList,
  isDuplicateRelease,
  getAllReleases,
  GithubListReleaseResponse,
  Version,
  getVersionMetadata,
  getGithubData,
} from "./github";
import * as sut from "./github";

describe("github", () => {
  const originalEnv = { ...process.env };
  const mockedGetRef = octokitGetRef as jest.MockedFunction<typeof octokitGetRef>;

  beforeEach(() => {
    process.env.GITHUB_ACTION = "fake-action";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  describe("getVersionMetadata", () => {
    it("should return the version metadata", async () => {
      const version = await getVersionMetadata("1.0.0");

      expect(mockedGetRef).toHaveBeenCalledWith({
        owner: "mocked-owner",
        repo: "mocked-repo",
        ref: "tags/v1.0.0",
      });

      expect(version).toEqual({
        number: "1.0.0",
        name: "v1.0.0",
        ref: { object: { sha: "fake-sha" }, ref: "refs/tags/v1.0.0" },
      });
    });
  });

  describe("getGithubData", () => {
    it("should call getAllRelease", async () => {
      await getGithubData("1.0.0");
    });
  });

  describe("releaseExists", () => {
    it("should return true if release exosts", async () => {
      expect(
        releaseExists({ number: "1.0.0", name: "v1.0.0", ref: undefined }, [
          { tag_name: "v1.0.1" },
          { tag_name: "v1.0.0" },
        ] as GithubReleaseList),
      ).toBe(true);
    });

    it("should return false if release does not exists", async () => {
      const releases = [{ tag_name: "v0.0.9" }, { tag_name: "v0.1.0" }] as GithubReleaseList;

      expect(releaseExists({ name: "1.0.0", number: "1.0.0", ref: undefined }, releases)).toBe(
        false,
      );
    });
  });

  describe("isDuplicateRelease", () => {
    it("should return true if release exists with the same sha", async () => {
      expect(
        isDuplicateRelease({
          patch: { name: "v1.0.0", number: "1.0.0", ref: { object: { sha: "sha" } } } as Version,
          sha: "sha",
          releases: [{ tag_name: "v1.0.0", sha: "sha" }] as unknown as GithubReleaseList,
        }),
      ).toBe(true);
    });

    it("should return false if the version has been released with a different sha", () => {
      expect(
        isDuplicateRelease({
          patch: { name: "v1.0.0", number: "1.0.0", ref: { object: { sha: "sha" } } } as Version,
          sha: "different_sha",
          releases: [{ tag_name: "v1.0.0", sha: "sha" }] as unknown as GithubReleaseList,
        }),
      ).toBe(false);
    });

    it("should return false if the version is not in the list of releases", () => {
      expect(
        isDuplicateRelease({
          patch: { name: "v1.0.0", number: "1.0.0", ref: undefined },
          sha: "different_sha",
          releases: [],
        }),
      ).toBe(false);
    });
  });

  describe("isSemVerBump", () => {
    let releases: GithubReleaseList;

    beforeEach(() => {
      releases = [{ tag_name: "v1.0.0" }] as GithubReleaseList;
    });

    it("should return true if it is a valid new patch version", async () => {
      expect(isSemVerBump({ name: "v1.0.1", number: "1.0.1", ref: undefined }, releases)).toBe(
        true,
      );
    });

    it("should return false if version the tag already exists", async () => {
      expect(isSemVerBump({ name: "v1.0.0", number: "1.0.0", ref: undefined }, releases)).toBe(
        false,
      );
    });

    it("should return false if version skips a patch version", async () => {
      expect(isSemVerBump({ name: "v1.0.2", number: "1.0.2", ref: undefined }, releases)).toBe(
        false,
      );
    });

    it("should return true it is a valid minor bump", async () => {
      expect(isSemVerBump({ name: "v1.1.0", number: "1.1.0", ref: undefined }, releases)).toBe(
        true,
      );
    });

    it("should return true if it is a valid major bump", async () => {
      expect(isSemVerBump({ name: "v2.0.0", number: "2.0.0", ref: undefined }, releases)).toBe(
        true,
      );
    });

    it("should return true if it is a valid initial version", async () => {
      expect(isSemVerBump({ name: "v1.0.0", number: "1.0.0", ref: undefined }, [])).toBe(true);
    });

    it("should return false if it is not a valid initial version", async () => {
      expect(isSemVerBump({ name: "v1.1.0", number: "1.1.0", ref: undefined }, [])).toBe(false);
    });

    it("should return true if it a valid bump of an older version", async () => {
      releases = [{ tag_name: "v1.0.0" }, { tag_name: "v1.1.0" }] as GithubReleaseList;

      expect(isSemVerBump({ name: "v1.0.1", number: "1.0.1", ref: undefined }, releases)).toBe(
        true,
      );
    });
  });

  describe("getIncrementType", () => {
    it("should return patch for a patch version", () => {
      expect(getIncrementType("v1.0.1")).toBe("patch");
    });

    it("should return minor for a minor version", () => {
      expect(getIncrementType("v1.1.0")).toBe("minor");
    });

    it("should return major for a major version", () => {
      expect(getIncrementType("v2.0.0")).toBe("major");
    });

    it("should throw an error for an invalid version", () => {
      expect(() => {
        getIncrementType("v1.0");
      }).toThrow();
    });

    it("should return patch for a 0.0.0", () => {
      expect(getIncrementType("v0.0.0")).toBe("patch");
    });
  });

  describe("getAllReleases", () => {
    const mockedListReleases = listReleases as jest.MockedFunction<typeof listReleases>;

    it("should get the octokit client", async () => {
      await getAllReleases();
      expect(_github.getOctokit).toHaveBeenCalled();
    });

    it("should call listReleases with the correct parameters", async () => {
      mockedListReleases.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            tag_name: "v1.0.0",
            name: "Release 1.0.0",
            body: "First release",
          },
          {
            id: 2,
            tag_name: "v1.1.0",
            name: "Release 1.1.0",
            body: "Second release",
          },
        ],
      } as GithubListReleaseResponse);

      await getAllReleases();

      expect(mockedListReleases).toHaveBeenCalledWith({
        owner: "mocked-owner",
        repo: "mocked-repo",
        per_page: 100,
        page: 1,
      });

      expect(mockedListReleases).toHaveBeenCalledTimes(2);
    });

    it("should concatenate the results of multiple api calls", async () => {
      mockedListReleases.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            tag_name: "v1.0.0",
            name: "Release 1.0.0",
            body: "First release",
          },
          {
            id: 2,
            tag_name: "v1.1.0",
            name: "Release 1.1.0",
            body: "Second release",
          },
        ],
      } as GithubListReleaseResponse);

      mockedListReleases.mockResolvedValueOnce({
        data: [
          { id: 3, tag_name: "v1.2.0", name: "Release 1.2.0", body: "Third release" },
          { id: 4, tag_name: "v1.3.0", name: "Release 1.3.0", body: "Fourth release" },
        ],
      } as GithubListReleaseResponse);

      const releases = await getAllReleases();

      expect(releases).toEqual([
        { id: 1, tag_name: "v1.0.0", name: "Release 1.0.0", body: "First release" },
        { id: 2, tag_name: "v1.1.0", name: "Release 1.1.0", body: "Second release" },
        { id: 3, tag_name: "v1.2.0", name: "Release 1.2.0", body: "Third release" },
        { id: 4, tag_name: "v1.3.0", name: "Release 1.3.0", body: "Fourth release" },
      ]);

      expect(mockedListReleases).toHaveBeenCalledTimes(3);
    });
  });

  describe("getRef", () => {
    const mockedGetRef = octokitGetRef as jest.MockedFunction<typeof octokitGetRef>;

    it("should get the octokit client", async () => {
      await getRef("v1.0.0");
      expect(_github.getOctokit).toHaveBeenCalled();
    });

    it("should call getRef with the correct parameters", async () => {
      await getRef("v1.0.0");

      expect(mockedGetRef).toHaveBeenCalledWith({
        owner: "mocked-owner",
        repo: "mocked-repo",
        ref: "tags/v1.0.0",
      });
    });

    it("should return the tag", async () => {
      const tag = await getRef("v1.0.0");
      expect(tag).toEqual({ ref: "refs/tags/v1.0.0", object: { sha: "fake-sha" } });
    });

    it("should throw an error if the tag does not exist", async () => {
      mockedGetRef.mockRejectedValueOnce(new Error("Not Found"));

      await expect(getRef("v1.0.0")).rejects.toThrow("Not Found");
    });

    it("should return an undefined if the tag is not found", async () => {
      const err = new RequestError("Not Found", 404, {
        response: { headers: { status: "404" }, status: 404, url: "", data: {} },
        request: { headers: { authorization: "" }, url: "", method: "GET" },
      });
      mockedGetRef.mockRejectedValueOnce(err);

      const tag = await getRef("v1.0.0");
      expect(tag).toBeUndefined();
    });
  });

  describe("deleteTag", () => {
    const mockedDeleteRef = deleteRef as jest.MockedFunction<typeof deleteRef>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should delete a tag", async () => {
      await deleteTag("refs/tags/v1.0.0");

      expect(mockedDeleteRef).toHaveBeenCalledWith({
        owner: "mocked-owner",
        repo: "mocked-repo",
        ref: "tags/v1.0.0",
      });
    });

    it("should correctly handle an error thrown by deleteRef", async () => {
      mockedDeleteRef.mockRejectedValueOnce(new Error("Not Found"));

      await expect(deleteTag("refs/tags/v1.0.0")).rejects.toThrow("Not Found");

      expect(_core.info).toHaveBeenCalledWith("Not Found");
    });
  });

  describe("createOrUpdateTag", () => {
    const spyOnCreateTag = jest.spyOn(sut, "createTag");
    const spyOnCreateTagRef = jest.spyOn(sut, "createTagRef");
    const spyOnDeleteTag = jest.spyOn(sut, "deleteTag");
    let version: Version;

    beforeEach(() => {
      version = { name: "v1.0.0", number: "1.0.0", ref: undefined };
    });

    it("should call createTag and createTagRef", async () => {
      const sha = "sha";
      await createOrUpdateTag(version, sha);

      expect(_github.getOctokit).toHaveBeenCalled();
      expect(spyOnCreateTag).toHaveBeenCalledWith({ sha, version });

      expect(spyOnCreateTagRef).toHaveBeenCalledWith({ version, sha });
    });

    it("should call deleteTag if there is an existing ref", async () => {
      version.ref = { object: { sha: "sha" }, ref: "refs/tags/v1.0.0" } as sut.GithubRef;
      const sha = "sha";

      await createOrUpdateTag(version, sha);

      expect(_github.getOctokit).toHaveBeenCalled();

      expect(spyOnDeleteTag).toHaveBeenCalledWith("refs/tags/v1.0.0");
      expect(spyOnCreateTag).toHaveBeenCalledWith({ sha, version });

      expect(spyOnCreateTagRef).toHaveBeenCalledWith({ version, sha });
    });
  });

  describe("createTag", () => {
    const mockedOctokitCreateTag = octokitCreateTag as jest.MockedFunction<typeof octokitCreateTag>;

    it("should create a tag", async () => {
      await createTag({
        version: { name: "v1.0.0", number: "1.0.0", ref: undefined },
        sha: "mocked-sha",
      });
      expect(_github.getOctokit).toHaveBeenCalled();
    });

    it("should call octokit creatTag function with correct parameters", async () => {
      await createTag({
        version: { name: "v1.0.0", number: "1.0.0", ref: undefined },
        sha: "mocked-sha",
      });

      expect(mockedOctokitCreateTag).toHaveBeenCalledWith({
        owner: "mocked-owner",
        repo: "mocked-repo",
        tag: "v1.0.0",
        message: `For release 1.0.0`,
        object: "mocked-sha",
        type: "commit",
      });
    });
  });

  describe("createTagRef", () => {
    const mockedOctokitCreateRef = ockokitCreateRef as jest.MockedFunction<typeof ockokitCreateRef>;

    it("should call createRef with the correct parameters", async () => {
      await createTagRef({
        version: { name: "v1.0.0", number: "1.0.0", ref: undefined },
        sha: "mocked-sha",
      });

      expect(_github.getOctokit).toHaveBeenCalled();

      expect(mockedOctokitCreateRef).toHaveBeenCalledWith({
        owner: "mocked-owner",
        repo: "mocked-repo",
        ref: "refs/tags/v1.0.0",
        sha: "mocked-sha",
      });
    });
  });

  describe("createRelease", () => {
    const mockedOctokitCreateRelease = octokitCreateRelease as jest.MockedFunction<
      typeof octokitCreateRelease
    >;
    beforeEach(() => {
      mockedOctokitCreateRelease.mockResolvedValueOnce({ data: { id: 1, tag_name: "v1.0.0" } });
    });

    it("should create a release", async () => {
      await createRelease(
        { name: "v1.0.0", number: "1.0.0", ref: undefined },
        ["file1", "file2"],
        "body",
      );
      expect(_github.getOctokit).toHaveBeenCalled();
    });

    it("should call octokit createRelease function with correct parameters", async () => {
      const version = { name: "v1.0.0", number: "1.0.0", ref: undefined };
      const files = ["file1", "file2"];
      const body = "body";

      await createRelease(version, files, body);

      expect(mockedOctokitCreateRelease).toHaveBeenCalled();
      expect(mockedOctokitCreateRelease).toHaveBeenCalledWith({
        owner: "mocked-owner",
        repo: "mocked-repo",
        tag_name: "v1.0.0",
        name: `Release v1.0.0`,
        body: "body",
      });
    });

    it("should upload files to the release", async () => {
      const mockedOctokitUploadReleaseAsset = octokitUploadReleaseAsset as jest.MockedFunction<
        typeof octokitUploadReleaseAsset
      >;
      const mockedReadFileSync = _fs.readFileSync as jest.MockedFunction<typeof _fs.readFileSync>;
      mockedReadFileSync.mockReturnValueOnce("file1");
      mockedReadFileSync.mockReturnValueOnce("file2");

      const version = { name: "v1.0.0", number: "1.0.0", ref: undefined };
      const files = ["file1", "file2"];
      const body = "body";

      await createRelease(version, files, body);

      expect(_fs.readFileSync).toHaveBeenCalledWith("file1");
      expect(_fs.readFileSync).toHaveBeenCalledWith("file2");

      expect(mockedOctokitUploadReleaseAsset).toHaveBeenCalledTimes(2);
      expect(mockedOctokitUploadReleaseAsset).toHaveBeenCalledWith({
        owner: "mocked-owner",
        repo: "mocked-repo",
        release_id: 1,
        name: "Release v1.0.0 - file1",
        data: "file1",
      });
    });
  });
});
