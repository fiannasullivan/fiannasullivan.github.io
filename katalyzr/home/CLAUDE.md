# Katalyzr — Homepage

The base page a Katalyzr applicant lands on (hiring manager side comes later). Plain HTML/CSS/JS, no build step.

Layout follows Fianna's sketch: CSG header and four tiles in a 2x2 grid (Your Matches, Your Introductions, Your Profile, Settings). Each tile opens a sub-page; every sub-page has a navy **Home** button at the bottom to come back (it's not on the homepage itself).

Prototype 3's last step ("Take me home") links here with `?stage=introduced`, which shows the introduction as complete. Without it, the page shows the applicant mid-way (psychologist conversation scheduled).

- `index.html` — page shell. Asset links end in `?v=N`: bump N when you change a CSS/JS file so browsers don't show a cached copy.
- `styles.css`, `brand.css` — copied from `../prototype-3/` so the look matches (compiled Tailwind + CSG branding). Change brand colors in `brand.css`.
- `home.css` — homepage-only layout (`.k-*` classes): tiles, Home tile, panels, timeline, switches, dialog.
- `home.js` — the page. Data at the top (`APPLICANT`, `HIRING_MANAGER` = the applicant's match, `JOURNEY` = the 7 steps); `state.view` picks the page; one render function per page.

Product rules (from the INFO 490 brief) the homepage follows:
- Invite-only; matches are chosen by hand by CSG. Nobody can browse jobs or applicants.
- Opt out at any time (Settings → Opt out).
- Past matches are only kept if the user opts in (Settings → Keep my match history).
- Applicants can keep their card for next time (skip steps 1–3).
- Desktop only.
