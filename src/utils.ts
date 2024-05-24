import * as semver from "semver";

export interface VersionNumberAliases {
  major: string;
  minor: string;
  patch: string;
  nextMinor: string;
}

export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const toTagName = (version: string) => `v${version}`;

export const deriveVersionAliases = (versionNumber: string): VersionNumberAliases => {
  const major = semver.major(versionNumber);
  const minor = semver.minor(versionNumber);
  const patch = semver.patch(versionNumber);

  return {
    major: `${major}`,
    minor: `${major}.${minor}`,
    patch: `${major}.${minor}.${patch}`,
    nextMinor: `${major}.${minor + 1}`,
  };
};

export const toFilesArray = (files: string): string[] =>
  files.split(/\r|\n/).filter((file) => file != "");
