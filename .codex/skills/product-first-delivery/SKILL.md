---
name: product-first-delivery
description: Deliver BrasilTvLive product work as small complete vertical slices centered on visible user outcomes. Use when planning, implementing, fixing, reviewing, or finishing UI and functional product tasks in this repository. Prevent architecture, CI/CD, tests, telemetry, abstractions, refactors, and future-platform work from expanding beyond what the current acceptance criteria actually require. Require runnable or visual evidence before considering a product task complete.
---

# Product First Delivery

## Workflow

For every task:

1. Read the requested user-visible outcome and acceptance criteria.
2. Read the repository `AGENTS.md`.
3. Inspect only the repository areas needed for the requested outcome.
4. For UI work, open `docs/references/brasiltvlive-mockup.png` before editing code.
5. Implement the smallest complete vertical slice that satisfies the acceptance criteria.
6. Run the application or relevant feature.
7. Verify the actual user-visible behavior.
8. Fix blockers and visible mismatches.
9. Run only targeted validation relevant to the delivered behavior.
10. Report the product result and stop.

## Priority order

Use this priority order when deciding what to do next:

1. Working user-visible product behavior.
2. Correctness of that behavior.
3. User experience and visual fidelity.
4. Required integration.
5. Targeted tests that protect the delivered behavior.
6. Cleanup directly caused by the current change.

Infrastructure improvements come later and only when required by the current task.

## Anti-overengineering gate

Before creating any abstraction, service, framework, pipeline, test harness, monitoring layer, deployment mechanism, adapter, feature flag, migration, cache, or refactor, ask:

`Is this required to satisfy the current acceptance criteria?`

If the answer is no, do not implement it.

If it may be useful later, list it as deferred work instead.

## UI work

For BrasilTvLive UI tasks:

- treat `docs/references/brasiltvlive-mockup.png` as the canonical visual reference;
- do not invent a new visual direction unless explicitly requested;
- use real React/React Native components;
- never use the complete mockup as a background image to simulate completion;
- prefer a direct screenshot comparison over building visual-regression infrastructure during the MVP;
- fix obvious layout, hierarchy, spacing, gradient, focus-state, and proportion mismatches before completion.

## Testing

Run existing relevant tests when available.

Add only the smallest tests needed to protect behavior introduced by the current task. Do not create or expand testing infrastructure merely because it could be useful in the future.

A green test suite is evidence of correctness; it is not evidence that the requested product feature is complete.

## Completion gate

Do not mark a task complete because groundwork exists.

Completion requires the requested user outcome to work.

For UI work, show a screenshot/render of the implementation.
For functional work, demonstrate the user flow or runtime result.

Once acceptance criteria are satisfied, stop. Do not continue with unrelated improvements.

## Final report

Keep the final report product-oriented:

- Product result
- What now works
- Evidence/verification
- Files materially changed
- Blockers or deferred items, only if relevant

Do not lead with internal architecture, test counts, pipeline work, or refactoring unless those were explicitly requested deliverables.
