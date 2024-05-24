import { info as coreInfo, getBooleanInput, getInput, setFailed } from "@actions/core";
import { GithubData, createOrUpdateTag, createRelease, getGithubData } from "./github";
import { validateGithubState, validateInputs, DuplicateReleaseError } from "./validate";
import { toFilesArray } from "./utils";

export type Payload = Omit<ActionInputs & GithubData, "validateOnly">;

export const getValidatedData = async () => {
  const inputs = getInputs();
  const { versionNumber } = inputs;

  validateInputs(inputs);

  const githubData = await getGithubData(versionNumber);
  const payload = { ...inputs, ...githubData };

  validateGithubState(payload);

  return payload;
};

export const createReleaseWithAliases = async (payload: Payload) => {
  const { patch, minor, major, nextMinor, sha, files, body } = payload;
  // Create Release
  await createOrUpdateTag(patch, sha);
  await createRelease(patch, files, body);

  // Create Major and Minor Aliases
  await createOrUpdateTag(minor, sha);
  if (!nextMinor.ref) {
    await createOrUpdateTag(major, sha);
  }
};
/**
 * The main function for the action.
 * It decides whether to a) only validate and return or b) create a tag and release.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function run(): Promise<any> {
  try {
    const { validateOnly, ...payload } = await getValidatedData();

    if (validateOnly) {
      coreInfo("Validation successful. Exiting without creating a release.");
      return;
    }

    await createReleaseWithAliases(payload);
  } catch (error) {
    if (error instanceof DuplicateReleaseError) {
      // If release already exists, do not fail action (idempotent)
      coreInfo(error.message);
    } else if (error instanceof Error) {
      setFailed(error.message);
    }
  }
}

export type ActionInputs = {
  versionNumber: string;
  validateOnly: boolean;
  files: string[];
  body: string;
  sha: string;
};

export const getInputs = (): ActionInputs => {
  const sha = process.env.GITHUB_SHA || "";
  return {
    versionNumber: getInput("version"),
    validateOnly: getBooleanInput("validate-only"),
    files: toFilesArray(getInput("files")),
    body: getInput("body"),
    sha,
  };
};
