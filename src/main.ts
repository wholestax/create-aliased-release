import fs from "fs";
import * as core from "@actions/core";
import { parseBooleanFromString } from "./utils";
import { validateVersion } from "./validate";
import { createRelease, createTag } from "./find-release";

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString());
    core.debug(new Date().toTimeString());

    // Set outputs for other workflow steps to use
    core.setOutput("time", new Date().toTimeString());

    const doValidationOnly = parseBooleanFromString(core.getInput("validate"));
    const version = fs.readFileSync(core.getInput("version"), "utf8").trim();

    core.debug(`Version: ${version}`);

    const isValid = await validateVersion(version);

    if (doValidationOnly || !isValid) {
      core.setFailed(
        "Validation failed. The version set is already exists, or is not a valid increment of an existing version",
      );
      return;
    }
    const files = core.getInput("files").split(/\r|\n/);
    const body = core.getInput("body");
    // Crete a Tag and Release for the version
    core.debug("Creating tag and release");
    // first create the tag
    createTag(version);
    // then create the release
    createRelease(version, files, body);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
