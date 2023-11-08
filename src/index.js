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
const github_1 = __importDefault(require("@actions/github"));
const octokit_1 = require("octokit");
const openai_1 = __importDefault(require("openai"));
const prompt_1 = require("./prompt");
const AVATAR = '<img src="https://raw.githubusercontent.com/nukeop/nuclear/568664b782cbc5eff62b5d26113b78bcfaf75b94/packages/app/resources/media/nuki/nuki_teaching.png" width="150" height="150" />';
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const pull_number = (_a = github_1.default.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number;
    const owner = (_c = (_b = github_1.default.context.payload.repository) === null || _b === void 0 ? void 0 : _b.owner) === null || _c === void 0 ? void 0 : _c.login;
    const repo = (_d = github_1.default.context.payload.repository) === null || _d === void 0 ? void 0 : _d.name;
    if (!pull_number) {
        throw new Error("No PR number found");
    }
    if (!owner) {
        throw new Error("No owner found");
    }
    if (!repo) {
        throw new Error("No repo found");
    }
    const diffUrl = `https://patch-diff.githubusercontent.com/raw/${owner}/${repo}/pull/${pull_number}.diff`;
    const diff = yield (yield fetch(diffUrl)).text();
    if (diff.split("\n").length > 200) {
        throw new Error("Too many lines changed. Large PRs are not supported yet.");
    }
    const client = new openai_1.default({
        apiKey: process.env.INPUT_OPENAI_API_KEY,
    });
    const prompt = (0, prompt_1.createPrompt)();
    const chatCompletion = yield client.chat.completions.create({
        messages: [
            { role: "system", content: prompt },
            // pullRequest is a diff string, but the type definition is wrong
            { role: "user", content: diff },
        ],
        max_tokens: 1024,
        model: "gpt-4-1106-preview",
    });
    const reviewContent = (_e = chatCompletion.choices[0].message) === null || _e === void 0 ? void 0 : _e.content;
    const app = new octokit_1.App({
        appId: "423357",
        privateKey: process.env.INPUT_GITHUB_APP_PRIVATE_KEY,
    });
    const installation = yield app.octokit.rest.apps.getRepoInstallation({
        owner,
        repo,
    });
    const octokit = yield app.getInstallationOctokit(installation.data.id);
    yield octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: `${AVATAR}\n\n${reviewContent}`,
    });
    console.log(reviewContent);
}))();
