# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build    # Compile TypeScript
npm run dev      # Dev mode (ts-node)
npm start        # Run compiled server
npm publish      # Publish to npm (requires --access public --auth-type=web)
```

## Architecture

**External MCP server** for the UP ONLY prediction app. TypeScript, published as `@arenatwo/uponly-mcp` on npm. Uses Firebase Client SDK (not Admin) for Firestore access and Strapi public API for fixture data.

Defaults to production (`arenatwocom` Firebase project, `strapi.arenatwo.com`). All config overridable via env vars.

## Deployment Rules

**CRITICAL: Never publish to npm or merge to main without explicit user approval.**

- `npm publish` pushes a new version to the public npm registry — this is irreversible (versions cannot be reused).
- Always bump the version in `package.json` before publishing.
- Test changes locally before requesting approval.
- Work on feature branches. Only merge to main when approved.

## Related Repositories

- `~/sandbox/uponly` — UP ONLY Next.js app on Vercel (`uponly.arenatwo.com`)
- `~/sandbox/firebase` — Firebase Cloud Functions backend
- `~/sandbox/strapi` — Strapi CMS backend on Render
