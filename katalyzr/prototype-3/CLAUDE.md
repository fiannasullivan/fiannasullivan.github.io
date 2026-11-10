# Katalyzr — Prototype 3

Plain HTML/CSS/JS port of the v0 build that was at katalyzr.vercel.app. No build step, no npm: open `index.html` or serve the folder.

- `index.html` — page shell; loads Montserrat + Carlito from Google Fonts, then `styles.css`, `brand.css` and `app.js`. Those links end in `?v=N`: bump N whenever you change a CSS/JS file, or browsers keep showing the cached old version.
- `brand.css` — Culminate Strategy Group branding (palette, fonts, navy header, coral CTAs), layered over `styles.css`.
- `styles.css` — the compiled Tailwind v4 stylesheet copied from the Vercel build. It only contains classes the original app used, so a NEW Tailwind class won't work unless you add a matching rule here (append plain CSS at the bottom, e.g. `.my-class{...}`). Theme colors are CSS variables in `:root` (`--primary`, `--brass`, `--accent`, ...).
- `app.js` — the whole app, one IIFE:
  - Data at the top (steps, sample applicant `SAMPLE_APPLICANT`, hiring manager `MATCH`, psychologist `PSYCH`, chapters, skill/value lists).
  - `state` object + `goTo(step)`; `render()` rebuilds `#root` from HTML strings and restores input focus.
  - One function per screen: `welcomeScreen`, `buildScreen`, `waitingScreen`, `matchScreen`, `episodeScreen`, `interviewScreen(kind)`, `completeScreen`.
  - Clicks are handled by one delegated listener keyed on `data-action` attributes.
  - Animations (`animate-in ...`) are wrapped in `anim()` so they only play when a step first appears.
- `images/` — sample photos and podcast cover.

Desktop-only (min width 1200px), matching the Katalyzr spec.
