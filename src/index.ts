import * as core from "@actions/core";
import * as github from "@actions/github";
import { generateMessage } from "./generate.js";
import { getDiff } from "./diff.js";
import { postComment } from "./comment.js";

async function run(): Promise<void> {
  try {
    const provider = core.getInput("provider") as "openai" | "anthropic";
    const apiKey = core.getInput("api-key", { required: true });
    const model = core.getInput("model") || undefined;
    const mode = core.getInput("mode") as "pr-comment" | "commit-summary";
    const maxDiffLength = Math.max(
      1000,
      parseInt(core.getInput("max-diff-length"), 10) || 10000,
    );
    const language = core.getInput("language");
    const customPrompt = core.getInput("custom-prompt") || undefined;
    const githubToken = core.getInput("github-token");

    const context = github.context;
    const diff = await getDiff(githubToken, context, maxDiffLength);

    if (!diff) {
      core.warning("No diff found. Skipping AI message generation.");
      core.setOutput("message", "");
      return;
    }

    const message = await generateMessage({
      provider,
      apiKey,
      model,
      diff,
      language,
      customPrompt,
    });

    core.setOutput("message", message);
    core.info(`Generated message:\n${message}`);

    if (mode === "pr-comment" && context.payload.pull_request) {
      await postComment(githubToken, context, message);
      core.info("Posted PR comment.");
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unexpected error occurred");
    }
  }
}

run();
