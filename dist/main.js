"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const fs_1 = __importDefault(require("fs"));
const core = __importStar(require("@actions/core"));
const utils_1 = require("./utils");
const validate_1 = require("./validate");
const find_release_1 = require("./find-release");
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Log the current timestamp, wait, then log the new timestamp
            core.debug(new Date().toTimeString());
            core.debug(new Date().toTimeString());
            // Set outputs for other workflow steps to use
            core.setOutput("time", new Date().toTimeString());
            const doValidationOnly = (0, utils_1.parseBooleanFromString)(core.getInput("validate"));
            const version = fs_1.default.readFileSync(core.getInput("version"), "utf8").trim();
            core.debug(`Version: ${version}`);
            const isValid = yield (0, validate_1.validateVersion)(version);
            if (doValidationOnly || !isValid) {
                core.setFailed("Validation failed. The version set is already exists, or is not a valid increment of an existing version");
                return;
            }
            const files = core.getInput("files").split(/\r|\n/);
            const body = core.getInput("body");
            // Crete a Tag and Release for the version
            core.debug("Creating tag and release");
            // first create the tag
            (0, find_release_1.createTag)(version);
            // then create the release
            (0, find_release_1.createRelease)(version, files, body);
        }
        catch (error) {
            // Fail the workflow run if an error occurs
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
exports.run = run;
