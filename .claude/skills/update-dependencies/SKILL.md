---
name: update-dependencies
description: Orchestrates dependency management using pnpm. Checks for outdated packages, facilitates user-guided updates, prunes unused dependencies, and deduplicates the dependency tree. Ensures project integrity through automated linting, formatting, testing, and build verification.
license: Complete terms in file LICENSE
---

# Update Dependencies Skill

This skill automates the process of checking for and applying package updates while ensuring the project remains clean and buildable.

## Workflow

1. **Check for Updates**: Run `pnpm outdated` to see which packages have newer versions available.
2. **User Review**: Present the list of outdated packages to the user.
3. **Selection**: Use the `ask_user` tool to confirm which packages the user wants to upgrade and which to skip.
4. **Apply Updates**: Run `pnpm update <package1> <package2> ...` for the selected packages.
5. **Prune Dependencies**: Run `pnpm prune` to remove unreferenced packages.
6. **Deduplicate Dependencies**: Run `pnpm dedupe` to optimize the dependency tree.
7. **Lint and Fix**: Run `pnpm run lint:fix` to address any new linting issues introduced by the updates.
8. **Format Code**: Run `pnpm run format` to ensure consistent code styling.
9. **Run Tests**: Execute `pnpm test` to verify functionality after updates.
10. **Verify Build**: Run `pnpm run build` to confirm that the updates haven't broken the build process.

## Commands

- `pnpm outdated`: Check for updates.
- `pnpm update [packages...]`: Update selected packages.
- `pnpm prune`: Remove unreferenced packages.
- `pnpm dedupe`: Deduplicate dependencies.
- `pnpm run lint:fix`: Fix linting issues.
- `pnpm run format`: Format source code.
- `pnpm test`: Run project tests.
- `pnpm run build`: Verify project integrity.
