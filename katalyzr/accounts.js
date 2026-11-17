/* Katalyzr tester logins, shared by the Applicant Prototype and the homepage.
   Each tester gets their own username, password, name and invitation code, and their own saved card
   and progress in the browser. To add a tester, run:  python3 katalyzr/tools/add-tester.py "Full Name"
   and paste the line it prints into ACCOUNTS below.
   Prototype only: passwords are stored as salted SHA-256 hashes so they aren't readable in the repo,
   but a static site can't truly keep logins secret. Don't reuse a real password here. */
(function () {
  "use strict";

  const ACCOUNTS = [
    // The original demo applicant. demo: true keeps Jordan's sample card, photo and sample LinkedIn profile.
    { username: "jordan.ellis", name: "Jordan Ellis", code: "KTZ-0417", demo: true, salt: "1d9702723b18bc32", hash: "97d49adf08dc93b5cbdcfa6ebd728c7a0a68132867338205997208d1248e3fff" },
    { username: "fianna.sullivan", name: "Fianna Sullivan", code: "KTZ-0418", salt: "54d08a0388c34ca8", hash: "20a789a2c728c9d9b30f00f9445276c8d90783932e43cc48d6604144470643d2" },
  ];
  const DEMO = "jordan.ellis";
  const SESSION_KEY = "katalyzr-session-v1";

  const norm = (u) => String(u || "").trim().toLowerCase();
  function find(username) { return ACCOUNTS.find((a) => a.username === norm(username)) || null; }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Resolves to the account if the username and password match, otherwise null
  async function check(username, password) {
    const a = find(username);
    if (!a || !password) return null;
    return (await sha256(a.salt + ":" + password)) === a.hash ? a : null;
  }

  // Who is signed in on this browser (shared by the prototype and the homepage)
  function session() {
    try { const s = JSON.parse(localStorage.getItem(SESSION_KEY)); return s ? find(s.username) : null; } catch (e) { return null; }
  }
  function signIn(username) { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ username: norm(username), at: Date.now() })); } catch (e) { /* storage unavailable */ } }
  function signOut() { try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* storage unavailable */ } }

  // Every saved thing is kept per person, so testers sharing a computer don't see each other's cards
  const key = (base, username) => base + ":" + norm(username);
  const CARD_KEY = "katalyzr-card-v1"; // the applicant's card, shared by the prototype and the homepage
  function readCard(username) {
    try { const d = JSON.parse(localStorage.getItem(key(CARD_KEY, username))); return d && typeof d === "object" && d.card ? d.card : null; } catch (e) { return null; }
  }
  function writeCard(username, card) {
    const save = (c) => localStorage.setItem(key(CARD_KEY, username), JSON.stringify({ card: c, savedAt: Date.now() }));
    try { save(card); return true; }
    catch (e) { try { save({ ...card, photo: null }); } catch (e2) { /* storage unavailable */ } return false; } // too big: drop the uploaded photo
  }
  function clearCard(username) { try { localStorage.removeItem(key(CARD_KEY, username)); } catch (e) { /* storage unavailable */ } }

  // A simple initials portrait, used when a tester skips ahead without uploading a photo
  function initialsPhoto(name) {
    const ini = String(name || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#221f3b"/><circle cx="200" cy="150" r="92" fill="#f4687b"/><text x="200" y="150" dy=".35em" text-anchor="middle" font-family="Montserrat, Arial, sans-serif" font-size="78" font-weight="600" fill="#fff">${ini.replace(/[<>&"]/g, "")}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  window.KatalyzrAccounts = { ACCOUNTS, DEMO, find, check, session, signIn, signOut, key, readCard, writeCard, clearCard, initialsPhoto };
})();
