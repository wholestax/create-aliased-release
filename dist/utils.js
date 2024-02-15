"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBooleanFromString = exports.isError = void 0;
const isError = (error) => {
    return error instanceof Error;
};
exports.isError = isError;
const parseBooleanFromString = (input) => {
    if (input.toLowerCase() === "true") {
        return true;
    }
    else if (input.toLowerCase() === "false" || input == "") {
        return false;
    }
    else {
        throw new Error("Input string must be 'true' or 'false'.");
    }
};
exports.parseBooleanFromString = parseBooleanFromString;
