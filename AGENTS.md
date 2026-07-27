# Coding Rules

## Editing
- Modify only relevant code. Avoid rewriting unrelated files.
- Read current file contents before editing.
- Keep git diff minimal.
- Never leave placeholder comments.

## Dependencies
- Prefer existing packages.
- Before adding new dependencies, explain reason first.

## TypeScript
- Avoid `any`.
- Use explicit return types for public functions.
- Use union/enums for fixed values.
- Prefer named exports.

## Error Handling
- Handle expected errors explicitly.
- Do not log entire error objects. Log relevant fields only.

## UI
- Logic refactors must not change visual UI.
- Avoid new CSS files or inline styles unless necessary.

## Safety
- Do not modify config files without explaining changes first.
- Do not delete existing code unless requested.

## Code Style
- Keep code readable.
- Use concise snippets in responses.

## Git Safety
- Never run destructive Git commands such as `git reset`, `git checkout --`, `git clean`, or commands that discard user changes.
- Never create commits or push to remote repositories (`git commit`, `git push`) unless explicitly requested by the user.
- Do not alter Git history.
- If Git state is unclear, inspect first and ask before taking actions that may affect existing work.

## Project Documentation & Planning (if exist)
- Always follow project planning and documentation files before implementing changes.
- Read and comply with the latest versions of these documents:

  - `wireframe.md`
  - `implementation_plan.md`

- If a requested change conflicts with these documents:
  - Explain the conflict first.
  - Do not implement changes that violate the documented plan without confirmation.
- If documentation is missing or unclear, ask before making major architectural decisions.
