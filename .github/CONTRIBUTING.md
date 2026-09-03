# Contributing

Thank you for your interest in contributing!

## Commit Message Guidelines

This repository uses [Semantic Release](https://github.com/semantic-release/semantic-release) to automatically generate version numbers, tags, and release notes based on commit messages.

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. 

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **`feat`**: A new feature (triggers a **MINOR** release).
- **`fix`**: A bug fix (triggers a **PATCH** release).
- **`docs`**: Documentation only changes.
- **`style`**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **`refactor`**: A code change that neither fixes a bug nor adds a feature.
- **`perf`**: A code change that improves performance.
- **`test`**: Adding missing tests or correcting existing tests.
- **`build`**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).
- **`ci`**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs).
- **`chore`**: Other changes that don't modify src or test files.
- **`revert`**: Reverts a previous commit.

### Breaking Changes

Any commit that introduces a breaking change MUST contain `BREAKING CHANGE:` in the footer. This will trigger a **MAJOR** release.

#### Example:
```
feat(api): allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```
