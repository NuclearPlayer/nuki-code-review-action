"use strict";
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
const core = require("@actions/core");
const github = require("@actions/github");
const openai_1 = __importDefault(require("openai"));
const prompt_1 = require("./prompt");
const AVATAR = '<img src="https://raw.githubusercontent.com/nukeop/nuclear/568664b782cbc5eff62b5d26113b78bcfaf75b94/packages/app/resources/media/nuki/nuki_teaching.png" width="150" height="150" />';
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    console.log(github.context);
    const pull_number = (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number;
    const owner = (_c = (_b = github.context.payload.repository) === null || _b === void 0 ? void 0 : _b.owner) === null || _c === void 0 ? void 0 : _c.login;
    const repo = (_d = github.context.payload.repository) === null || _d === void 0 ? void 0 : _d.name;
    if (!pull_number) {
        throw new Error("No PR number found");
    }
    if (!owner) {
        throw new Error("No owner found");
    }
    if (!repo) {
        throw new Error("No repo found");
    }
    const githubToken = core.getInput("GITHUB_TOKEN");
    const octokit = github.getOctokit(githubToken);
    const linesChanged = yield octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number,
    });
    const linesChangedNumber = linesChanged.data.reduce((acc, { changes }) => acc + changes, 0);
    if (linesChangedNumber > 200) {
        throw new Error("Too many lines changed. Large PRs are not supported yet.");
    }
    const { data: pullRequest } = yield octokit.rest.pulls.get({
        owner,
        repo,
        pull_number,
        mediaType: {
            format: "diff",
        },
    });
    const client = new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const prompt = (0, prompt_1.createPrompt)();
    const chatCompletion = yield client.chat.completions.create({
        messages: [
            { role: "system", content: prompt },
            // pullRequest is a diff string, but the type definition is wrong
            { role: "user", content: pullRequest },
        ],
        max_tokens: 1024,
        model: "gpt-4-1106-preview",
    });
    const reviewContent = (_e = chatCompletion.choices[0].message) === null || _e === void 0 ? void 0 : _e.content;
    console.log(`${AVATAR}\n\n${reviewContent}`);
}))();
