import { isError, toTagName, toFilesArray, deriveVersionAliases } from "./utils";

describe("utils", () => {
  describe("isError", () => {
    it("should return true if the value is an instance of Error", () => {
      expect(isError(new Error())).toBe(true);
    });

    it("should return false if the value is not an instance of Error", () => {
      expect(isError({})).toBe(false);
    });
  });

  describe("deriveVersionAliases", () => {
    it("should return an object with the major, minor, patch, and nextMinor versions", () => {
      expect(deriveVersionAliases("1.0.0")).toEqual({
        major: "1",
        minor: "1.0",
        patch: "1.0.0",
        nextMinor: "1.1",
      });
    });
  });

  describe("toTagName", () => {
    it("should prepend 'v' to the version", () => {
      expect(toTagName("1.0.0")).toBe("v1.0.0");
    });
  });

  describe("toFilesArray", () => {
    it("should split the string by new lines and return an array of files", () => {
      expect(toFilesArray("file1\nfile2\nfile3")).toEqual(["file1", "file2", "file3"]);
    });

    it("should split the string by carriage returns and new lines", () => {
      expect(toFilesArray("file1\r\nfile2\r\nfile3")).toEqual(["file1", "file2", "file3"]);
    });

    it("should filter out empty strings", () => {
      expect(toFilesArray("file1\n\nfile2\nfile3")).toEqual(["file1", "file2", "file3"]);
    });
  });
});
