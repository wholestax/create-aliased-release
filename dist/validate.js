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
exports.validateVersion = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const find_release_1 = require("./find-release");
const validateVersion = (version) => __awaiter(void 0, void 0, void 0, function* () {
    const { owner, repo } = github.context.repo;
    //read version from file specified by version input
    try {
        //check if release exists
        if (yield (0, find_release_1.existsRelease)(`v${version}`)) {
            core.setFailed(`Release v${version} already exists`);
            return false;
        }
        // check if release is valid SemVer bump to an existing release
        if (!(yield (0, find_release_1.isSemVerBump)(version))) {
            core.setFailed(`Invalid version: ${version}`);
            return false;
        }
        return true;
    }
    catch (error) {
        core.setFailed(`Error reading version file: ${error}`);
        return false;
    }
});
exports.validateVersion = validateVersion;
