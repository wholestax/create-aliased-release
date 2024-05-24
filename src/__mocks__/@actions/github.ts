// __mocks__/actions/github.ts

export const mockListMatchingRefs = jest.fn();
export const mockGetReleaseByTag = jest.fn();

export const listReleases = jest.fn().mockResolvedValue({ data: [] }); // Default mock response
export const deleteRef = jest.fn();
export const getRef = jest
  .fn()
  .mockResolvedValue({ data: { ref: "refs/tags/v1.0.0", object: { sha: "fake-sha" } } });
export const createTag = jest.fn().mockResolvedValue({ data: {} });
export const createRelease = jest.fn().mockResolvedValue({ data: {} });
export const uploadReleaseAsset = jest.fn().mockResolvedValue({ data: {} });
export const createRef = jest.fn().mockResolvedValue({ data: {} });

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
      listMatchingRefs: mockListMatchingRefs
        .mockResolvedValueOnce({ data: [{}] })
        .mockResolvedValueOnce({ data: [] }), // Default mock response
      createRef,
      createTag,
      deleteRef,
      getRef,
    },

    repos: {
      getReleaseByTag: mockGetReleaseByTag.mockResolvedValue({ data: {} }),
      // Mock for listReleases method
      listReleases,
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
              browser_download_url: "https://example.com/download/asset-name.zip",
            },
            // Add more mocked assets as needed
          ],
        },
      }),
      createRelease,
      uploadReleaseAsset,
      // Add more mocked repo methods as needed
    },
  },
}));
