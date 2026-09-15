# Contributing

## Branching

- Never push directly to `main`. All work happens on a feature branch and
  gets merged via pull request.
- `main` is the production branch. `develop` is the integration branch.
- Branch names must be prefixed by type:
  - `feature/` — new functionality
  - `fix/` — bug fixes
  - `docs/` — documentation only
  - `chore/` — tooling, dependencies, config, anything not covered above

  Example: `feature/user-profile-page`

## Commits

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>
```

- `type` is one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
  `test`, `chore`.
- `description` must be at least 10 characters long.
- Commit messages are enforced by commitlint via a `commit-msg` git hook —
  a commit that doesn't follow the format will be rejected.

Example:

```
feat: add pagination to the user list
```

## Pre-commit checks

A `pre-commit` git hook runs `lint-staged`, which lints and formats staged
files automatically. Fix any reported issues before committing.
