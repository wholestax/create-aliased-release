import * as semver from "semver";
import {
  releaseExists,
  isSemVerBump,
  Version,
  GithubReleaseList,
  isDuplicateRelease,
} from "./github";

export type ValidateOptions = {
  patch: Version;
  releases: GithubReleaseList;
  sha: string;
};

export type ValidateResult = {
  isValid: boolean;
  errorMessage: string | undefined;
  isDuplicateRelease: boolean;
};

export class DuplicateReleaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateReleaseError";
    this.message = message;
  }
}

/**
 * Validate a release version and throw an error if it is invalid.
 * @param version - The version to validate.
 * @param releaseSha - The sha of the release.
 * @param releases - The list of existing releases.
 * @param tag - The tag that may already exist in Github
 * @throws {Error} If the version is invalid.
 * @returns {ValidateResult} The result of the validation.
 **/
export const validateGithubState = ({ patch, releases, sha }: ValidateOptions) => {
  const version = patch.number;

  if (isDuplicateRelease({ patch, releases, sha })) {
    throw new DuplicateReleaseError(
      `Release ${version} already exists for this sha. Exiting without creating a release.`,
    );
  }

  if (releaseExists(patch, releases)) {
    throw new Error(`Release ${version} already exists for a different commit`);
  }

  // check if version is valid SemVer bump to an existing release
  if (!isSemVerBump(patch, releases)) {
    throw new Error(`Version '${version}' is not a valid SemVer bump of an existing Release'`);
  }
};

export const validateInputs = ({
  versionNumber,
  sha,
  files,
}: {
  versionNumber: string;
  sha: string;
  files: string[];
}) => {
  if (!versionNumber) {
    throw new Error("The `version` input parameter is required.");
  }

  if (versionNumber.startsWith("v")) {
    throw new Error(
      `Version '${versionNumber}' should not start with 'v'. Please provide a version number without the 'v' prefix.`,
    );
  }

  if (!semver.valid(versionNumber)) {
    throw new Error(`Version '${versionNumber}' is not a valid SemVer version.`);
  }

  if (versionNumber.split("-").length > 1) {
    throw new Error(`Prerelease versions are not supported.`);
  }

  if (sha.length === 0) {
    throw new Error("The commit sha is required.");
  }

  if (!Array.isArray(files)) {
    throw new Error("The files input parameter must be a newline separated list of files.");
  }
};
