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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRelease = exports.createTag = exports.isSemVerBump = exports.existsRelease = exports.getReleases = void 0;
const fs = __importStar(require("fs"));
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
const client_1 = require("./client");
const utils_1 = require("./utils");
const semver = __importStar(require("semver"));
const getReleases = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const octokit = yield (0, client_1.getOctokit)();
        const { owner, repo } = github.context.repo;
        const { data: releases } = yield octokit.rest.repos.listReleases({
            owner,
            repo,
        });
        return releases; // This contains the list of releases
    }
    catch (error) {
        if ((0, utils_1.isError)(error)) {
            core.setFailed(`Error fetching releases: ${error.message}`);
        }
        return [];
    }
});
exports.getReleases = getReleases;
const existsRelease = (tag) => __awaiter(void 0, void 0, void 0, function* () {
    const octokit = yield (0, client_1.getOctokit)();
    try {
        const { owner, repo } = github.context.repo;
        // Check if the tag exists
        const { data: refs } = yield octokit.rest.git.listMatchingRefs({
            owner,
            repo,
            ref: `tags/${tag}`,
        });
        const tagExists = refs.length > 0;
        if (!tagExists) {
            console.log(`Tag ${tag} does not exist.`);
            return false;
        }
        // Check if the release exists for the tag
        try {
            yield octokit.rest.repos.getReleaseByTag({
                owner,
                repo,
                tag,
            });
            // If the above call succeeds, the release exists
            console.log(`Release for tag ${tag} exists.`);
            return true;
        }
        catch (error) {
            console.log(`Release for tag ${tag} does not exist.`);
            return false;
        }
    }
    catch (error) {
        console.error(`An error occurred: ${error}`);
        return false;
    }
});
exports.existsRelease = existsRelease;
/**
 * Check if the version is a valid SemVer bump to the latest release
 * @param version - The version to check
 *
 */
const isSemVerBump = (version) => __awaiter(void 0, void 0, void 0, function* () {
    const octokit = yield (0, client_1.getOctokit)();
    const { owner, repo } = github.context.repo;
    const { data: releases } = yield octokit.rest.repos.listReleases({
        owner,
        repo,
    });
    const latestRelease = releases[0].tag_name;
    const semVerBump = semver.gt(version, latestRelease);
    return semVerBump;
});
exports.isSemVerBump = isSemVerBump;
function createTag(version) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a tag with github API
        const octokit = yield (0, client_1.getOctokit)();
        const { owner, repo } = github.context.repo;
        const tag = `${version}`;
        const sha = github.context.sha;
        yield octokit.rest.git.createTag({
            owner,
            repo,
            tag,
            message: `${version}`,
            object: sha,
            type: "commit",
        });
    });
}
exports.createTag = createTag;
/**
 * CreateRelease creates a release for the tag
 * @param {string} version - The version of the release
 * @param {string[]} files - The files to attach to the release
 * @param {string} body - The body of the release
 * */
const createRelease = (version, files, body) => __awaiter(void 0, void 0, void 0, function* () {
    const octokit = yield (0, client_1.getOctokit)();
    const { owner, repo } = github.context.repo;
    const release = yield octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: version,
        name: version,
        body: body,
    });
    for (const file of files) {
        yield octokit.rest.repos.uploadReleaseAsset({
            owner,
            repo,
            release_id: release.data.id,
            name: file,
            data: fs.readFileSync(file, "utf-8"),
        });
    }
});
exports.createRelease = createRelease;
