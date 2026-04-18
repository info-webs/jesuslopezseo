# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
```

No test suite or linter scripts are configured. Use `npx prettier --write .` for formatting (Astro-aware via `prettier-plugin-astro`).

## Architecture

This is an **Astro 3.5.5** static site for a personal SEO consulting business. It uses Tailwind CSS, MDX, and Astro Content Collections for the blog.

### Path Aliases (tsconfig.json)

| Alias | Maps to |
|---|---|
| `@components/*` | `src/components/*` |
| `@layouts/*` | `src/layouts/*` |
| `@assets/*` | `src/assets/*` |
| `@pages/*` | `src/pages/*` |
| `@utils/*` | `src/utils/*` |
| `@lib/*` | `src/lib/*` |

### Content Collections

Blog posts live in `src/content/blog/` as Markdown files. The schema (`src/content/config.ts`) validates:

```ts
{ draft: boolean, title, excerpt, image, publishDate, author, category, tags }
```

Posts with `draft: true` or a future `publishDate` are filtered out at build time. The blog uses dynamic routing:
- `/blog/[slug].astro` — individual post pages
- `/blog/[...page].astro` — paginated listing (6 posts/page, newest first)

### Layout Chain

Pages use one of two layout paths:
- **Marketing pages**: `Layout.astro` → `RootLayout.astro`
- **Blog posts**: `BlogLayout.astro` → `Layout.astro` → `RootLayout.astro`
- **Markdown legal pages**: `MdLayout.astro`

### Homepage Composition

`src/pages/index.astro` assembles the landing page from independent section components: `Hero → Solutions → Highlights → Testimonial → Clients → Pricing → FAQ`.

### Styling

Tailwind is configured in `tailwind.config.cjs` with a custom palette (`primary`, `success`, `danger`). Use these semantic color tokens instead of raw Tailwind colors.
