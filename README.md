# Raise-with-You

A clean, production-friendly repository baseline with strong Git defaults.

## Quick Start

1. Clone the repository.
2. Create your feature branch:
   - `git switch -c feat/your-feature`
3. Make changes and commit using the commit template:
   - `git commit`
4. Push and open a pull request.

## Branching

- `main`: protected, releasable branch
- `feat/*`: feature branches
- `fix/*`: bug fixes
- `chore/*`: maintenance

## Commit Convention

Use Conventional Commit style:

- `feat: add new user onboarding flow`
- `fix: prevent crash when token expires`
- `chore: update dependency lockfile`
- `docs: improve setup instructions`

## Recommended Repository Settings (GitHub)

- Protect `main` with required pull request reviews.
- Require status checks to pass before merge.
- Disable force-push to `main`.
- Enable auto-delete of merged branches.
- Enable Dependabot security updates.

## Local Git Quality of Life

Optional setup commands:

```bash
git config commit.template .gitmessage
git config core.autocrlf input
git config pull.rebase false
git config fetch.prune true
```

## Included Baseline Files

- `.gitignore` for Node/Next/general tooling noise
- `.gitattributes` for stable line endings
- `.editorconfig` for consistent formatting
- `LICENSE` (MIT)
- GitHub CI workflow for lint/build/test placeholder
- PR and issue templates
