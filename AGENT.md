# AGENT.md

## Project

- Project: `blogs`
- Stack: VitePress, TypeScript, Mermaid, vitepress-plugin-diagrams
- Deployment: GitHub Pages via `.github/workflows/deploy.yml`

## Runtime

- Dev: `npm run docs:dev`.
- Build: `npm run docs:build`.
- Preview: `npm run docs:preview`.
- Default VitePress dev port is usually `5173`; default preview port is usually `4173`.

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
