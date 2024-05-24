export const createActionAuth = jest.fn(() =>
  jest.fn(() => {
    return { token: "my-fake-token" };
  }),
);
