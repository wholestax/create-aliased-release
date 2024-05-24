export const getTokens = jest.fn().mockResolvedValue("mocked-token");

export const mockedOctokit = {
  rest: {
    git: {
      listMatchingRefs: jest.fn().mockResolvedValue({ data: [{}] }),
      createTag: jest.fn().mockResolvedValue({ data: {} }),
    },
    repos: {
      getReleaseByTag: jest.fn().mockResolvedValue({ data: {} }),
      listReleases: jest.fn().mockResolvedValue({ data: [] }),
      getRelease: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          tag_name: "v1.0.0",
          name: "Release 1.0.0",
          body: "First release",
          assets: [],
        },
      }),
    },
  },
};

export const getOctokit = jest.fn().mockImplementation(() => mockedOctokit);
