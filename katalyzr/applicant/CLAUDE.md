# Katalyzr — Applicant Prototype (was Prototype 3)

Plain HTML/CSS/JS port of the v0 build that was at katalyzr.vercel.app. No build step, no npm: open `index.html` or serve the folder.

- Before the invitation, `accountScreen()` is a sign-in page for everyone (no name on it): people enter the username and password from their invitation email, which unlocks their personal invitation. Shown until `state.account.signedIn`. The password is checked, then cleared — never saved. Applicant logins are in `../accounts.js` (one per tester, salted SHA-256 hashes); hiring-manager logins in `LOGINS` redirect to `../hiring-manager/`. "Prototype only · Fill as Jordan" fills the demo login.
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

Testers (accounts):
- `../accounts.js` (`window.KatalyzrAccounts`) is shared with the homepage: the login list, who's signed in on this browser (`katalyzr-session-v1`), and each tester's card (`katalyzr-card-v1:<username>`, read and written by both pages). Progress is saved per tester under `katalyzr-invite-v1:<username>`.
- `me()` is the signed-in tester. Their first name, invitation code and starting card come from their account. Jordan (`demo: true`) keeps his sample card, photo and sample LinkedIn profile; other testers start with just their name, and "Fill with sample" / skipping ahead keeps their name and gives an initials photo.
- To add a tester: `python3 katalyzr/tools/add-tester.py "Full Name" [username] [code]`, paste the printed line into `ACCOUNTS`, bump `accounts.js?v=` in both index.html files, and give the tester the printed password.
- `?restart=1` (homepage "Back to the first match") replays the invitation but keeps the tester signed in with their card. `?next=home` (homepage when nobody is signed in) goes back to the homepage after sign-in.

Fill from LinkedIn:
- LinkedIn doesn't let other websites read profiles from a link, so testers paste their link and upload the PDF from "More → Save to PDF". `../linkedin-pdf.js` (`window.KatalyzrLinkedIn`) reads it in the browser with pdf.js (`../vendor/pdfjs/`, Apache-2.0) and fills name, current or last role + company, years worked (job dates, overlaps counted once), "what you've built" (first sentence of About, else the latest role's description) and top skills (mapped onto the card's skill chips). The link is checked against the one inside the PDF.
