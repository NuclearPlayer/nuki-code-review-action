const core = require("@actions/core");
const github = require("@actions/github");

import { getOctokit } from "@actions/github";

import OpenAI from "openai";
import { createPrompt } from "./prompt";

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

  const octokit = (github.getOctokit as typeof getOctokit)(process.env.GITHUB_TOKEN!);

  const linesChanged = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
  });

  const linesChangedNumber = linesChanged.data.reduce(
    (acc, { changes }) => acc + changes,
    0,
  );

  if (linesChangedNumber > 200) {
    throw new Error("Too many lines changed. Large PRs are not supported yet.");
  }

  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: {
      format: "diff",
    },
  });

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const prompt = createPrompt();
  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: "system", content: prompt },
      // pullRequest is a diff string, but the type definition is wrong
      { role: "user", content: pullRequest as unknown as string },
    ],
    max_tokens: 1024,
    model: "gpt-4-1106-preview",
  });
  const reviewContent = chatCompletion.choices[0].message?.content;

  console.log(`${AVATAR}\n\n${reviewContent}`);
})();
