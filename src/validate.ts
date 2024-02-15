import * as core from "@actions/core";
import { existsRelease, isSemVerBump } from "./find-release";

export const validateVersion = async (version: string) => {
  //read version from file specified by version input
  try {
    //check if release exists
    if (await existsRelease(`${version}`)) {
      core.setFailed(`Release ${version} already exists`);
      return false;
    }

    // check if release is valid SemVer bump to an existing release
    if (!(await isSemVerBump(version))) {
      core.setFailed(`Invalid version: ${version}`);
      return false;
    }
    return true;
  } catch (error) {
    core.setFailed(`Error reading version file: ${error}`);
    return false;
  }
};
