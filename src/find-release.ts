import * as fs from "fs";
import * as github from "@actions/github";
import * as core from "@actions/core";
import { getOctokit } from "./client";
import { isError } from "./utils";
import * as semver from "semver";

export const getReleases = async () => {
  try {
    const octokit = await getOctokit();

    const { owner, repo } = github.context.repo;

    const { data: releases } = await octokit.rest.repos.listReleases({
      owner,
      repo,
    });
    return releases; // This contains the list of releases
  } catch (error) {
    if (isError(error)) {
      core.setFailed(`Error fetching releases: ${(error as Error).message}`);
    }
    return [];
  }
};

export const existsRelease = async (tag: string): Promise<boolean> => {
  const octokit = await getOctokit();

  try {
    const { owner, repo } = github.context.repo;
    // Check if the tag exists
    const { data: refs } = await octokit.rest.git.listMatchingRefs({
      owner,
      repo,
      ref: `tags/${tag}`,
    });
    const tagExists = refs.length > 0;
    if (!tagExists) {
      core.info(`Tag ${tag} does not exist.`);
      return false;
    }

    // Check if the release exists for the tag
    try {
      await octokit.rest.repos.getReleaseByTag({
        owner,
        repo,
        tag,
      });
      // If the above call succeeds, the release exists
      core.info(`Release for tag ${tag} exists.`);
      return true;
    } catch (error) {
      core.info(`Release for tag ${tag} does not exist.`);
      return false;
    }
  } catch (error) {
    core.info(`An error occurred: ${error}`);
    return false;
  }
};

/**
 * Check if the version is a valid SemVer bump to the latest release
 * @param version - The version to check
 *
 */
export const isSemVerBump = async (version: string): Promise<boolean> => {
  const octokit = await getOctokit();
  const { owner, repo } = github.context.repo;
  const { data: releases } = await octokit.rest.repos.listReleases({
    owner,
    repo,
  });

  const latestRelease = releases[0].tag_name;
  const semVerBump = semver.gt(version, latestRelease);
  return semVerBump;
};

export async function createTag(version: string) {
  // Create a tag with github API
  const octokit = await getOctokit();
  const { owner, repo } = github.context.repo;
  const tag = `${version}`;
  const sha = github.context.sha;
  await octokit.rest.git.createTag({
    owner,
    repo,
    tag,
    message: `${version}`,
    object: sha,
    type: "commit",
  });
}

/**
 * CreateRelease creates a release for the tag
 * @param {string} version - The version of the release
 * @param {string[]} files - The files to attach to the release
 * @param {string} body - The body of the release
 * */
export const createRelease = async (
  version: string,
  files: string[],
  body: string,
) => {
  const octokit = await getOctokit();
  const { owner, repo } = github.context.repo;
  const release = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: version,
    name: version,
    body: body,
  });

  for (const file of files) {
    await octokit.rest.repos.uploadReleaseAsset({
      owner,
      repo,
      release_id: release.data.id,
      name: file,
      data: fs.readFileSync(file, "utf-8"),
    });
  }
};
