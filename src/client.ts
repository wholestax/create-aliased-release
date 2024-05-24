import { createActionAuth } from "@octokit/auth-action";
import * as github from "@actions/github";

export const getToken = async (): Promise<string> => {
  const auth = createActionAuth();

  const authentication = await auth();
  const { token } = authentication;

  return token;
};

export const getOctokit = async () => {
  const token = await getToken();

  return github.getOctokit(token);
};
