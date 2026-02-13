# ai-commit-msg

[![CI](https://github.com/ofershap/ai-commit-msg/actions/workflows/ci.yml/badge.svg)](https://github.com/ofershap/ai-commit-msg/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> GitHub Action that generates AI-powered commit messages and PR summaries using OpenAI or Anthropic.

<p align="center">
  <img src="assets/demo.gif" alt="ai-commit-msg demo" width="600" />
</p>

## Why

- **Zero install** — runs as a GitHub Action, no CLI or npm package needed
- **Two providers** — OpenAI (GPT-4o-mini) and Anthropic (Claude Sonnet) out of the box
- **Conventional Commits** — generates `type(scope): description` format by default
- **PR comments** — posts a summary comment on PRs, updates on new pushes
- **Customizable** — custom prompts, language, model selection

## Quick Start

```yaml
name: AI Commit Message

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  ai-summary:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: ofershap/ai-commit-msg@v1
        with:
          api-key: ${{ secrets.OPENAI_API_KEY }}
```

That's it. Every PR gets an AI-generated summary comment.

## Configuration

### Inputs

| Input             | Required | Default        | Description                                                      |
| ----------------- | -------- | -------------- | ---------------------------------------------------------------- |
| `api-key`         | Yes      | —              | API key for OpenAI or Anthropic                                  |
| `provider`        | No       | `openai`       | `openai` or `anthropic`                                          |
| `model`           | No       | auto           | Model name (default: `gpt-4o-mini` / `claude-sonnet-4-20250514`) |
| `mode`            | No       | `pr-comment`   | `pr-comment` or `commit-summary`                                 |
| `max-diff-length` | No       | `10000`        | Max diff chars sent to AI (truncated if longer)                  |
| `language`        | No       | `english`      | Language for the generated message                               |
| `custom-prompt`   | No       | —              | Extra instructions appended to the prompt                        |
| `github-token`    | No       | `GITHUB_TOKEN` | Token for posting PR comments                                    |

### Outputs

| Output    | Description                  |
| --------- | ---------------------------- |
| `message` | The generated commit message |

## Examples

### With Anthropic

```yaml
- uses: ofershap/ai-commit-msg@v1
  with:
    provider: anthropic
    api-key: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Output Only (no PR comment)

```yaml
- uses: ofershap/ai-commit-msg@v1
  id: ai
  with:
    api-key: ${{ secrets.OPENAI_API_KEY }}
    mode: commit-summary
- run: echo "${{ steps.ai.outputs.message }}"
```

### Custom Prompt

```yaml
- uses: ofershap/ai-commit-msg@v1
  with:
    api-key: ${{ secrets.OPENAI_API_KEY }}
    custom-prompt: "Use emoji prefixes. Keep it under 50 chars."
```

### Non-English

```yaml
- uses: ofershap/ai-commit-msg@v1
  with:
    api-key: ${{ secrets.OPENAI_API_KEY }}
    language: hebrew
```

## How It Works

1. Reads the PR diff (or push commit diffs)
2. Sends the diff to OpenAI/Anthropic with a Conventional Commits prompt
3. Posts the generated message as a PR comment (or outputs it)
4. On subsequent pushes, updates the existing comment instead of creating a new one

## License

[MIT](LICENSE) &copy; [Ofer Shapira](https://github.com/ofershap)

---

### Other projects by [@ofershap](https://github.com/ofershap)

- [`ts-nano-event`](https://github.com/ofershap/ts-nano-event) — Typed event emitter in ~200 bytes
- [`use-stepper`](https://github.com/ofershap/use-stepper) — React hook for multi-step forms and wizards
- [`hebrew-slugify`](https://github.com/ofershap/hebrew-slugify) — Slugify Hebrew text for URLs
- [`env-guard`](https://github.com/ofershap/env-guard) — Validate .env files against a schema
- [`awesome-hebrew-dev`](https://github.com/ofershap/awesome-hebrew-dev) — Curated list of Hebrew developer resources
