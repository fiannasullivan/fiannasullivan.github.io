# Katalyzr — Homepage

The base page every Katalyzr user lands on, applicants and hiring managers alike. Plain HTML/CSS/JS, no build step.

Layout follows Fianna's sketch: CSG header, four tiles in a 2x2 grid (Your Matches, Outgoing Applications, Your Profile, Settings), and a navy **Home** tile centered underneath. Each tile opens a sub-page; every sub-page has the Home button at the bottom to come back.

- `index.html` — page shell. Asset links end in `?v=N`: bump N when you change a CSS/JS file so browsers don't show a cached copy.
- `styles.css`, `brand.css` — copied from `../prototype-3/` so the look matches (compiled Tailwind + CSG branding). Change brand colors in `brand.css`.
- `home.css` — homepage-only layout (`.k-*` classes): tiles, Home tile, panels, timeline, switches, dialog.
- `home.js` — the page. Data at the top (`APPLICANT`, `HIRING_MANAGER`, `JOURNEY` steps); `state.role` switches applicant / hiring-manager view (prototype control in the header); `state.view` picks the page; one render function per page.

Product rules (from the INFO 490 brief) the homepage follows:
- Invite-only; matches are chosen by hand by CSG. Nobody can browse jobs or applicants.
- Opt out at any time (Settings → Opt out).
- Past matches are only kept if the user opts in (Settings → Keep my match history).
- Applicants can keep their card for next time (skip steps 1–3).
- Hiring managers give a yes / no at the end of their process (Outgoing Applications).
- Desktop only.
