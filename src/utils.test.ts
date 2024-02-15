//unit test for utils.ts 
import {isError, parseBooleanFromString} from "./utils";
describe("utils",   () => {
  describe("isError", () => {
    it("should return true if the value is an instance of Error", () => {
      expect(isError(new Error())).toBe(true);
    });
    it("should return false if the value is not an instance of Error", () => {
      expect(isError("")).toBe(false);
    });
  });
  describe("parseBooleanFromString", () => {
    it("should return true if the value is 'true'", () => {
      expect(parseBooleanFromString("true")).toBe(true);
    });
    it("should return false if the value is 'false'", () => {
      expect(parseBooleanFromString("false")).toBe(false);
    });
    it("should return false if the value is not 'true' or 'false'", () => {
      expect(parseBooleanFromString("")).toBe(false);
    });
    it("should throw and error if the value is not 'true' or 'false'", () => {
      expect(() => parseBooleanFromString("hello")).toThrow();
    });
  });
});
