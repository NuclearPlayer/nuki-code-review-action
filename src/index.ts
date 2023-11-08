import { App } from "octokit";

import OpenAI from "openai";
import { createPrompt } from "./prompt";

const github = require("@actions/github");

const AVATAR =
  '<img src="https://raw.githubusercontent.com/nukeop/nuclear/568664b782cbc5eff62b5d26113b78bcfaf75b94/packages/app/resources/media/nuki/nuki_teaching.png" width="150" height="150" />';

(async () => {
  const pull_number = github.context.payload.pull_request?.number;
  const owner = github.context.payload.repository?.owner?.login;
  const repo = github.context.payload.repository?.name;
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
  const diff = await (await fetch(diffUrl)).text();

  if (diff.split("\n").length > 200) {
    throw new Error("Too many lines changed. Large PRs are not supported yet.");
  }

  const client = new OpenAI({
    apiKey: process.env.INPUT_OPENAI_API_KEY,
  });
  const prompt = createPrompt();
  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: "system", content: prompt },
      // pullRequest is a diff string, but the type definition is wrong
      { role: "user", content: diff },
    ],
    max_tokens: 1024,
    model: "gpt-4-1106-preview",
  });
  const reviewContent = chatCompletion.choices[0].message?.content;

  const app = new App({
    appId: "423357",
    privateKey: process.env.INPUT_GITHUB_APP_PRIVATE_KEY!,
  });

  const installation = await app.octokit.rest.apps.getRepoInstallation({
    owner,
    repo,
  });
  const octokit = await app.getInstallationOctokit(installation.data.id);
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body: `${AVATAR}\n\n${reviewContent}`!,
  });

  console.log(reviewContent);
})();
