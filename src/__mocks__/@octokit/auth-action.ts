// __mocks__/@octokit/auth-action.ts

export const createActionAuth = jest.fn(() =>
  jest.fn(() => {
    return { token: "my-fake-token" };
  }),
);
