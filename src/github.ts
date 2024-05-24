import * as fs from "fs";
import { Endpoints } from "@octokit/types";
import { RequestError } from "@octokit/request-error";
import * as github from "@actions/github";
import * as core from "@actions/core";
import { getOctokit } from "./client";
import * as semver from "semver";
import { deriveVersionAliases, toTagName } from "./utils";

export type GithubReleaseList = Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"];
export type GithubRelease = Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"][0];
export type GithubListReleaseResponse = Endpoints["GET /repos/{owner}/{repo}/releases"]["response"];

export type GithubRef = Endpoints["GET /repos/{owner}/{repo}/git/ref/{ref}"]["response"]["data"];

export interface Version {
  number: string;
  name: string;
  ref: GithubRef | undefined;
}

export interface GithubData {
  releases: GithubReleaseList;
  major: Version;
  minor: Version;
  patch: Version;
  nextMinor: Version;
}

export const getVersionMetadata = async (versionNumber: string): Promise<Version> => {
  const name = toTagName(versionNumber);
  const ref = await getRef(name);
  return { number: versionNumber, name, ref };
};

export const getGithubData = async (versionNumber: string): Promise<GithubData> => {
  const aliases = deriveVersionAliases(versionNumber);

  const releases = await getAllReleases();
  const major = await getVersionMetadata(aliases.major);
  const minor = await getVersionMetadata(aliases.minor);
  const patch = await getVersionMetadata(aliases.patch);
  const nextMinor = await getVersionMetadata(aliases.nextMinor);

  return { releases, patch, major, minor, nextMinor };
};

export const releaseExists = (version: Version, releases: GithubReleaseList): boolean => {
  return (
    releases.filter((release) => {
      return (
        semver.eq(release.tag_name, version.number) && release.target_commitish === version.ref?.ref
      );
    }).length > 0
  );
};

/**
 * Check if the commit sha and version match an already existing release
 * @param version - The version to Check
 * @param releases - The listReleases
 * @param refs - Array of VersionTagAlias objects
 * @param sha - The sha of the release
 * @returns  - True if this release is a duplicate, false otherwise
 */
export const isDuplicateRelease = ({
  patch,
  releases,
  sha: shaToRelease,
}: {
  patch: Version;
  releases: GithubReleaseList;
  sha: string;
}) => {
  const tagSha = patch.ref?.object?.sha;

  if (releaseExists(patch, releases) && shaToRelease === tagSha) {
    return true;
  }
  return false;
};

/**
 * Check if the version is a valid SemVer bump to the latest release
 * @param version - The version to check
 *
 */
export const isSemVerBump = (version: Version, releases: GithubReleaseList): boolean => {
  const { number } = version;
  if (releases.length === 0) {
    return ["0.0.0", "0.0.1", "0.1.0", "1.0.0"].reduce(
      (result, val) => result || semver.eq(version.number, val),
      false,
    );
  }

  const inc = getIncrementType(number);

  const previousRelease = releases
    .filter((release) => {
      return semver.lt(release.tag_name, number);
    })
    .sort((a, b) => semver.rcompare(a.tag_name, b.tag_name))
    .at(0);

  // If there is no previous release, version cannot be a valid release bump.
  if (!previousRelease) return false;

  const expectedVersion = semver.inc(previousRelease.tag_name, inc);

  if (!expectedVersion) return false;

  return semver.eq(number, expectedVersion);
};

export const getIncrementType = (version: string) => {
  if (semver.patch(version) > 0) {
    return "patch";
  }

  if (semver.minor(version) > 0) {
    return "minor";
  }

  if (semver.major(version) > 0) {
    return "major";
  }

  return "patch";
};

export const getAllReleases = async (): Promise<GithubReleaseList> => {
  const octokit = await getOctokit();
  const { owner, repo } = github.context.repo;
  const per_page = 100; // Maximum number of releases to fetch per page
  let page = 1;

  let results: GithubReleaseList = [];
  let response: GithubListReleaseResponse;

  do {
    response = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page,
      page,
    });

    results = results.concat(response.data);

    page++;
  } while (response.data.length > 0);

  return results;
};

export const getRef = async (tagName: string) => {
  const octokit = await getOctokit();
  const { owner, repo } = github.context.repo;
  try {
    core.info(`Getting ref for tag ${tagName}`);
    const { data: tag } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `tags/${tagName}`,
    });
    core.info(`Ref for tag ${tagName} found ${tag.ref}`);
    return tag;
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      return;
    }
    throw error;
  }
};

export const deleteTag = async (ref: string) => {
  const octokit = await getOctokit();
  const { owner, repo } = github.context.repo;
  core.info(`Deleting tag ${ref}`);

  ref = ref.replace("refs/", "");
  try {
    const result = await octokit.rest.git.deleteRef({
      owner,
      repo,
      ref,
    });
    core.info(`Tag ${ref} deleted`);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      core.info(`Error deleting tag ${owner}-${repo}-${ref}`);
      core.info(error.message);
    }
    throw error;
  }
};

export const createOrUpdateTag = async (version: Version, sha: string) => {
  const { name, ref, number } = version;

  if (ref) {
    core.info(`Tag ${name} already exists. Deleting and recreating. ref: ${ref.ref}`);
    await deleteTag(ref.ref);
  }

  core.info(`Creating tag ${name} for version ${number}`);
  await createTag({ sha, version });

  core.info(`Creating ref for tag ${name}`);
  return createTagRef({ version, sha });
};

export const createTag = async ({ sha, version }: { sha: string; version: Version }) => {
  // Create a tag with github API
  const octokit = await getOctokit();
  const { owner, repo } = github.context.repo;
  const { name, number } = version;

  const result = await octokit.rest.git.createTag({
    owner,
    repo,
    tag: name,
    message: `For release ${number}`,
    object: sha,
    type: "commit",
  });
  core.info(`Tag ${name} created`);
  return result;
};

export const createTagRef = async ({ version, sha }: { version: Version; sha: string }) => {
  const octokit = await getOctokit();
  const { owner, repo } = github.context.repo;

  // Create a reference with github API
  // This is required to create a tag
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/tags/${version.name}`,
    sha,
  });

  core.info(`Ref 'refs/tags/${version.name}' created`);
};

/**
 * CreateRelease creates a release for the tag
 * @param {string} version - The version of the release
 * @param {string[]} files - The files to attach to the release
 * @param {string} body - The body of the release
 * */
export const createRelease = async (version: Version, files: string[], body: string) => {
  const octokit = await getOctokit();
  const { owner, repo } = github.context.repo;

  core.info(`Creating release object for version ${version}`);

  const release = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: version.name,
    name: `Release ${version.name}`,
    body,
  });

  const results = [];
  for (const file of files) {
    const result = await octokit.rest.repos.uploadReleaseAsset({
      owner,
      repo,
      release_id: release.data.id,
      name: `Release ${release.data.tag_name} - ${file}`,
      //TODO: This is a hack to fool octokit into accepting a buffer
      // see https://github.com/octokit/octokit.js/discussions/2087
      data: fs.readFileSync(file) as unknown as string,
    });
    results.push(result);
  }
  return Promise.all(results);
};
