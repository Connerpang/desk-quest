#!/bin/sh
# Run by `pnpm install` (root `prepare` script). Points git at .githooks,
# unless a hooks path is already configured, e.g. a company-wide secret
# scanner, which must not be silently disabled for this repo.
command -v git >/dev/null 2>&1 || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

current="$(git config --get core.hooksPath)"
if [ -z "$current" ]; then
  git config core.hooksPath .githooks
elif [ "$current" != ".githooks" ]; then
  echo "git hooks: core.hooksPath is already set to $current; leaving it alone."
  echo "DeskQuest's gitleaks hook is .githooks/pre-commit if you want to chain it."
fi
