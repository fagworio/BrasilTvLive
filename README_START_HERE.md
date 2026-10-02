# BrasilTvLive - Codex Starter Pack

Copy the contents of this package into the root of the BrasilTvLive repository.

The package intentionally contains product guidance, the approved visual reference, task definitions and a repository-local Codex skill. It does not scaffold application code or CI/CD because the first Codex task should inspect the real repository and implement only what is required to deliver the first visible screen.

## Files

- `AGENTS.md` - permanent project rules for Codex.
- `.codex/skills/product-first-delivery/` - repository-local product-delivery skill.
- `docs/references/brasiltvlive-mockup.png` - canonical visual reference.
- `docs/UI_SPEC.md` - concise design interpretation for implementation.
- `docs/MVP.md` - product roadmap and scope boundaries.
- `tasks/001-tv-ui.md` - first implementation task.
- `tasks/002-mobile-ui.md` - second implementation task.
- `tasks/003-remote-navigation.md` - next functional slice after UI approval.

## First Codex request

Use a prompt like:

`Execute tasks/001-tv-ui.md. Follow AGENTS.md and use $product-first-delivery. Do not expand scope beyond the task acceptance criteria.`

Before accepting Task 001, compare the running screenshot to `docs/references/brasiltvlive-mockup.png`.
