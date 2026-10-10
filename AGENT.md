# AGENT.md

## Project

- Project: `blogs`
- Stack: VitePress, TypeScript, Mermaid, vitepress-plugin-diagrams
- Deployment: GitHub Pages via `.github/workflows/deploy.yml`

## Runtime

- Dev: `npm run docs:dev`.
- Build: `npm run docs:build`.
- Preview: `npm run docs:preview`.
- Dev and preview both use fixed port `4025`; occupied ports cause startup failure.

## Data Storage

- External database: none.
- Content source: `docs/posts/**.md`, VitePress config, and static assets.

## Codex Notes

- Do not add database config unless a real service is introduced.
- Preserve frontmatter fields when editing posts: `title`, `date`, `created`, `updated`.

## Git Workflow

- Use English commit messages, for example `docs: update LLM notes` or `style: refine homepage layout`.
- Before pushing, check the worktree with `git status --short`.
- When the user asks to push, commit the requested changes and run `git push origin master`.

## Port allocation

Web: 4025. API/services: 无独立后端. See `PORTS.md`; keep dev/preview ports fixed and fail on conflicts.
