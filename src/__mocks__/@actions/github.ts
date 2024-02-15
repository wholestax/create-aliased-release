// __mocks__/actions/github.ts

export const mockListMatchingRefs = jest.fn();
export const mockGetReleaseByTag = jest.fn();

export const context = {
  repo: {
    owner: "mocked-owner",
    repo: "mocked-repo",
  },
  issue: {
    number: 42,
  },
  payload: {
    pull_request: {
      number: 42,
      user: {
        login: "mocked-user",
      },
    },
  },
  sha: "mocked-sha",
  ref: "refs/heads/mock-branch",
};

export const getOctokit = jest.fn().mockImplementation(() => ({
  rest: {
    git: {
      listMatchingRefs: mockListMatchingRefs.mockResolvedValue({ data: [] }), // Default mock response
    },

    repos: {
      getReleaseByTag: mockGetReleaseByTag.mockResolvedValue({ data: {} }),
      // Mock for listReleases method
      listReleases: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            tag_name: "v1.0.0",
            name: "Release 1.0.0",
            body: "First release",
          },
          {
            id: 2,
            tag_name: "v1.1.0",
            name: "Release 1.1.0",
            body: "Second release",
          },
          // Add more mocked releases as needed
        ],
      }),

      // Mock for getRelease method
      getRelease: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          tag_name: "v1.0.0",
          name: "Release 1.0.0",
          body: "First release",
          assets: [
            {
              id: 101,
              name: "asset-name.zip",
              browser_download_url:
                "https://example.com/download/asset-name.zip",
            },
            // Add more mocked assets as needed
          ],
        },
      }),

      // Add more mocked repo methods as needed
    },
  },
}));
