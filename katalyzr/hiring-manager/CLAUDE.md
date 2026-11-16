# Katalyzr — Hiring Manager Prototype

The hiring manager's side of a Katalyzr introduction. Plain HTML/CSS/JS, no build step. Same look, sign-in page and engine as the Applicant Prototype (`../applicant/`): `styles.css` + `brand.css` are copies, and the helpers, cards, booking calendar, video call, saving and error handling in `app.js` came from it.

Flow (from the "Hiring manager flow" board in the Katalyzr User Flow design, updated to match the applicant side — no matching bot, Culminate chooses by hand):
- Sign in — same page as applicants; the login says who you are. Demo logins: `elena.vasquez` (hiring manager) and `jordan.ellis` (applicant), both `Katalyzr2026`. Signing in on either prototype with the other role's login hands off to the other prototype (`katalyzr-signin-handoff` in localStorage). The password is never saved.
- 0 Welcome — personal invitation from Karrie (less trust-building needed: they already know her). "How does Culminate find candidates?" builds trust in the applicant. Opt out.
- 1 Build your card — like applicants; "Use my episode draft" fills what was said on Uncommon Operator. The card is secondary to the role and episode in matching.
- 2 Define the role — title, team, arrangement, must-have skills (2–4), growth, purpose.
- 3 Flip to see your match — one candidate chosen by hand; "How we found Jordan" trust panel; Request an introduction (optional note; prototype: Jordan accepts at once) or Pass (reason: skills, culture, timing).
- 4 Read the Mindset brief — Jordan's progress + the brief Jordan approved, written by Dr. Marcus Hale.
- 5 Interview — book a time, Join locked until then (prototype "Skip to time"), Change date, video call.
- 6 Your decision — yes / no; a no needs a reason.
- 7 Introduction complete.

Saving: `katalyzr-manager-v1` in localStorage (step, card, role, intro, pass, booking, decision…). `?restart=1` starts fresh. Asset links end in `?v=N`: bump N when you change a CSS/JS file.
