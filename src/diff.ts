import * as github from "@actions/github";

export async function getDiff(
  token: string,
  context: typeof github.context,
  maxLength: number,
): Promise<string | null> {
  const octokit = github.getOctokit(token);
  const { owner, repo } = context.repo;

  if (context.payload.pull_request) {
    const { data: diff } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: context.payload.pull_request.number,
      mediaType: { format: "diff" },
    });
    const raw = diff as unknown as string;
    return truncateDiff(raw, maxLength);
  }

  if (context.payload.commits?.length) {
    const diffs: string[] = [];
    for (const commit of context.payload.commits as { id: string }[]) {
      const { data } = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: commit.id,
        mediaType: { format: "diff" },
      });
      diffs.push(data as unknown as string);
    }
    return truncateDiff(diffs.join("\n"), maxLength);
  }

  return null;
}

function truncateDiff(diff: string, maxLength: number): string {
  if (diff.length <= maxLength) return diff;
  return diff.slice(0, maxLength) + "\n\n... (diff truncated)";
}
