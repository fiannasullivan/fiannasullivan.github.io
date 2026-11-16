# Katalyzr — Prototype 3

Plain HTML/CSS/JS port of the v0 build that was at katalyzr.vercel.app. No build step, no npm: open `index.html` or serve the folder.

- Before the invitation, `accountScreen()` is a sign-in page for everyone (no name on it): people enter the username and password from their invitation email, which unlocks their personal invitation. Shown until `state.account.signedIn`. The password is checked, then cleared — never saved. Prototype: only `DEMO_LOGIN` (Jordan) works; "Prototype only · Fill as Jordan" fills it.
- `index.html` — page shell; loads Montserrat + Carlito from Google Fonts, then `styles.css`, `brand.css` and `app.js`. Those links end in `?v=N`: bump N whenever you change a CSS/JS file, or browsers keep showing the cached old version.
- `brand.css` — Culminate Strategy Group branding (palette, fonts, navy header, coral CTAs), layered over `styles.css`.
- `styles.css` — the compiled Tailwind v4 stylesheet copied from the Vercel build. It only contains classes the original app used, so a NEW Tailwind class won't work unless you add a matching rule here (append plain CSS at the bottom, e.g. `.my-class{...}`). Theme colors are CSS variables in `:root` (`--primary`, `--brass`, `--accent`, ...).
- `app.js` — the whole app, one IIFE:
  - Data at the top (steps, sample applicant `SAMPLE_APPLICANT`, hiring manager `MATCH`, psychologist `PSYCH`, chapters, skill/value lists).
  - `state` object + `goTo(step)`; `render()` rebuilds `#root` from HTML strings and restores input focus.
  - One function per screen: `welcomeScreen`, `buildScreen`, `waitingScreen`, `matchScreen`, `episodeScreen`, `interviewScreen(kind)`, `completeScreen`. The "Take me home" button on the complete page goes straight to `../home/?stage=introduced`, the applicant homepage.
  - Clicks are handled by one delegated listener keyed on `data-action` attributes.
  - Animations (`animate-in ...`) are wrapped in `anim()` so they only play when a step first appears.
- `images/` — sample photos and podcast cover.

Desktop-only (min width 1200px), matching the Katalyzr spec.

Saving and errors:
- Progress (step, card, flip, bookings, brief, podcast position, opt-out…) is saved to `localStorage` under `katalyzr-invite-v1` on every render, and restored on load, so a refresh keeps your place. `restart()` and `?restart=1` (used by the homepage's "Back to the first match") clear it. Saved data is cleaned by `cleanApplicant()` before use, so bad or old saves can't break a page.
- Uploaded photos are shrunk and stored as data URLs so they survive a refresh.
- `safe(label, draw)` wraps the podcast player, video call, booking calendar and Mindset brief: if one throws, it shows a small "couldn't load / Try again" box and the rest of the page still works. If a whole step throws, `errorScreen()` offers Try again / Go back a step / Start over.
- Every `<img>` has a `data-fallback` text; a document-level error listener swaps any image that fails to load for a placeholder.
