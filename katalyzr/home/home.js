/* Katalyzr homepage — the base every user lands on, applicants and hiring managers alike.
   Layout follows Fianna's sketch: CSG header, four tiles (Your Matches, Outgoing Applications,
   Your Profile, Settings) and a Home tile centered underneath. Same branding as Prototype 3.
   Rules from the INFO 490 brief: invite-only, no browsing jobs or applicants, matches are made
   by CSG, opt out at any time, past matches kept only if the user opts in, desktop-only. */
(function () {
  "use strict";

  /* ---------- Data ---------- */
  const APPLICANT = {
    photo: "images/applicant-sample.jpg",
    name: "Jordan Ellis",
    role: "Head of Operations, Lumen Health",
    skills: ["Systems thinking", "Operations", "Team building", "Data analysis", "Negotiation"],
    experienceYears: "11",
    experience: "Scaled two healthtech startups from seed to Series C; built ops teams from 3 to 60.",
    values: ["Candor", "Ownership", "Curiosity", "Craft"],
    workingStyle: ["Async-first", "Written decisions", "Deep work blocks"],
    personality: ["Direct", "Calm under pressure", "Curious"],
    mindset: "Leave every system better than you found it.",
  };
  const HIRING_MANAGER = {
    photo: "images/hiring-manager.jpg",
    name: "Elena Vasquez",
    role: "Chief Operating Officer",
    company: "Halcyon Robotics",
    skills: ["Systems thinking", "Operations", "Product strategy", "Team building", "Go-to-market"],
    experienceYears: "16",
    experience: "Took Halcyon from prototype lab to 400 people across three factories.",
    values: ["Candor", "Ownership", "Craft", "Long-term thinking"],
    workingStyle: ["Async-first", "Written decisions", "High autonomy"],
    personality: ["Direct", "Warm", "Calm under pressure"],
    mindset: "Build calm companies in chaotic markets.",
  };
  const PSYCH = { name: "Dr. Marcus Hale", photo: "images/psychologist.jpg" };
  const PODCAST = "Uncommon Operator";

  // Where each side's current introduction stands (7 steps to the final interview, per the brief)
  const JOURNEY = {
    applicant: [
      { title: "Invitation emailed", note: "Nov 2", done: true },
      { title: "Accepted your invitation", note: "Nov 3", done: true },
      { title: "Built your card", note: "Nov 3", done: true },
      { title: "Matched with Elena Vasquez", note: "Chosen by hand by CSG", done: true },
      { title: `Listened to Elena’s ${PODCAST} episode`, note: "Nov 5", done: true },
      { title: "Conversation with Dr. Marcus Hale", note: "Scheduled · Thu, Nov 12 · 2:00 PM", current: true },
      { title: "Introduction with Elena", note: "Scheduled after your conversation with Marcus" },
    ],
    manager: [
      { title: `Interviewed on ${PODCAST}`, note: "Episode 47 with Karrie", done: true },
      { title: "Joined Katalyzr", note: "Oct 28", done: true },
      { title: "Built your card", note: "Oct 28", done: true },
      { title: "Matched with Jordan Ellis", note: "Chosen by hand by CSG", done: true },
      { title: "Jordan listened to your episode", note: "Nov 5", done: true },
      { title: "Jordan’s conversation with Dr. Marcus Hale", note: "Scheduled · Thu, Nov 12 · 2:00 PM", current: true },
      { title: "Your introduction with Jordan", note: "You’ll get Jordan’s approved Mindset brief first" },
      { title: "Your decision", note: "Yes or no, after your conversation", decision: true },
    ],
  };

  /* ---------- State ---------- */
  const state = {
    role: "applicant", // "applicant" | "manager" (prototype switch in the header)
    view: "home", // "home" | "matches" | "outgoing" | "profile" | "settings"
    settings: { email: true, keepHistory: false, keepCard: true },
    decision: null, // hiring manager's yes/no
    modal: null, // "optout"
    optedOut: false,
  };
  const me = () => (state.role === "applicant" ? APPLICANT : HIRING_MANAGER);
  const them = () => (state.role === "applicant" ? HIRING_MANAGER : APPLICANT);
  const first = (n) => n.split(" ")[0];

  /* ---------- Helpers ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cx = (...a) => a.filter(Boolean).join(" ");
  const ICONS = {
    heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
    send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    "profile-card": '<path d="M4 6.375h13.5L22 10.875v4.75a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.25a2 2 0 0 1 2-2z"/><path d="M17.5 6.375v3a1.5 1.5 0 0 0 1.5 1.5h3"/><circle cx="12" cy="10.4" r="2.1"/><path d="M8.6 15.6a3.4 3.4 0 0 1 6.8 0"/>',
    settings: '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
    house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "hiring-manager": '<circle cx="8" cy="6" r="3.5"/><path d="M2 21v-1.5A5.5 5.5 0 0 1 7.5 14H11"/><rect x="13" y="11" width="8" height="10.5" rx="1.5"/><path d="M15.5 10.5h3"/><path d="M15.5 15h3"/><path d="M15.5 18h3"/>',
    "user-round": '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    sparkles: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
    "calendar-check": '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "log-out": '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    puzzle: '<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
    smile: '<path d="M15 10V9"/><path d="M16.472 15a6 6 0 0 1-8.943 0"/><path d="M9 10V9"/><circle cx="12" cy="12" r="10"/>',
    lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  };
  const icon = (name, cls = "") =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cx("lucide lucide-" + name, cls)}" aria-hidden="true">${ICONS[name]}</svg>`;
  const CSG_MARK = '<svg class="csg-logo" viewBox="12 12 83 87" fill="currentColor" aria-hidden="true"><path d="M88.2294 76.422C86.4259 79.2256 84.2551 81.809 81.8027 84.069C80.234 80.7079 78.0577 77.7398 75.4471 75.2555C80.2773 70.3397 83.2049 63.9559 83.7422 57.0278L83.9213 54.7017L59.9854 54.6862C57.598 54.6834 55.6612 56.619 55.6584 59.0055L79.1427 59.0191C78.2633 64.1478 75.806 68.8205 72.0791 72.5001C67.2981 69.1411 61.5248 67.1907 55.4034 67.1526C48.6359 67.1526 43.186 61.3902 43.706 54.5139C44.0898 49.4396 47.8171 45.0835 52.7859 43.9783C55.9592 43.2733 59.1355 43.8831 61.708 45.5265C63.5883 46.7292 66.0274 46.5821 67.741 45.1535C63.8531 40.4857 57.6524 38.3455 51.5044 39.8369C45.191 41.3693 40.3781 46.7428 39.5034 53.1808C38.1723 62.959 45.715 71.3633 55.2155 71.4722V71.4741C65.903 71.4741 75.413 78.2598 78.8821 88.3638L79.8724 91.2513L82.2662 89.3563C87.221 85.4369 91.3334 80.3844 94.1523 74.7475C92.04 73.6916 89.5068 74.438 88.2294 76.422Z"/><path d="M54.4907 79.7455C40.4509 79.7455 29.0742 68.1162 29.488 53.9838C29.8451 41.7951 39.1696 31.4652 51.263 29.9216C58.5299 28.9926 65.63 31.2373 70.9516 35.8953C72.6876 37.4173 75.2688 37.4466 77.041 35.9698C70.4966 28.1103 60.3701 24.1708 50.0312 25.7277C36.2015 27.81 25.6815 39.6703 25.1752 53.6449C24.5717 70.3153 37.9555 84.0676 54.4907 84.0676C59.9719 84.0676 64.5929 87.7745 65.8696 92.9355C62.5044 93.8674 59.0186 94.3369 55.4829 94.3369C33.5909 94.3369 15.8646 76.1607 16.6037 54.1055C17.2679 34.2388 33.148 17.8438 52.9875 16.6096C67.3935 15.7141 80.6913 22.6196 88.2456 34.4562C89.5111 36.4402 92.0478 37.1748 94.1524 36.1239C86.6114 21.0537 71.3056 11.815 54.4072 12.2241C31.0954 12.7872 12.2433 32.1453 12.259 55.462C12.2726 79.285 31.6581 98.659 55.4829 98.659C60.1012 98.659 64.6446 97.9352 68.9914 96.5049L70.6324 95.9643L70.4673 94.2444C69.672 85.9778 62.8025 79.7455 54.4907 79.7455Z"/></svg>';

  function shared(a, b) {
    const set = new Set(b.map((x) => x.toLowerCase()));
    return a.filter((x) => set.has(x.toLowerCase()));
  }
  function overlap() {
    const a = APPLICANT, m = HIRING_MANAGER;
    return { skills: shared(a.skills, m.skills), values: shared(a.values, m.values), style: [...shared(a.workingStyle, m.workingStyle), ...shared(a.personality, m.personality)] };
  }
  const avatar = (p, cls) => `<div class="${cx("shrink-0 overflow-hidden bg-muted", cls)}"><img src="${esc(p.photo)}" alt="" class="size-full object-cover"></div>`;
  const chips = (items) => `<ul class="k-chips">${items.map((i) => `<li class="k-chip">${esc(i)}</li>`).join("")}</ul>`;

  // Same profile card as the prototype, read-only
  function profileCard(p, label, highlight) {
    const sub = [p.role, p.company].filter(Boolean).join(" · ");
    const list = (title, ic, items) => `<div>
      <p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon(ic, "size-3.5 text-brass")}${esc(title)}</p>
      <ul class="flex flex-wrap gap-1.5">${items.map((i) => {
        const on = highlight && highlight.has(i.toLowerCase());
        return `<li class="${cx("rounded-full border px-2.5 py-0.5 text-xs", on ? "border-brass/60 bg-accent text-accent-foreground" : "bg-secondary/60 text-secondary-foreground")}">${esc(i)}</li>`;
      }).join("")}</ul></div>`;
    return `<article aria-label="${esc(label)}: ${esc(p.name)}" class="flex w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(60,40,10,0.18)]">
      <div class="relative aspect-[4/3] w-full bg-muted"><img src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}" class="size-full object-cover">
        <span class="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground backdrop-blur">${esc(label)}</span></div>
      <div class="flex flex-col gap-4 p-5">
        <header><h3 class="font-serif text-3xl leading-tight">${esc(p.name)}</h3><p class="text-sm text-muted-foreground">${esc(sub)}</p>
          <p class="mt-2 text-sm leading-relaxed text-pretty"><span class="font-medium text-foreground">${esc(p.experienceYears)} yrs · </span>${esc(p.experience)}</p></header>
        ${list("Key skills", "puzzle", p.skills)}${list("Values", "heart", p.values)}${list("Working style", "compass", p.workingStyle)}${list("Personality", "smile", p.personality)}
        <div><p class="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon("lightbulb", "size-3.5 text-brass")}Mindset</p>
          <blockquote class="border-l-2 border-brass pl-3 font-serif text-lg italic leading-snug text-pretty">“${esc(p.mindset)}”</blockquote></div>
      </div></article>`;
  }

  /* ---------- Layout ---------- */
  function header() {
    return `<header class="csg-header"><div class="k-header-inner">
      <div class="flex items-center gap-3">${CSG_MARK}<span class="font-serif text-2xl tracking-tight">Katalyzr</span><span class="text-xs text-muted-foreground">by Culminate Strategy Group</span></div>
      <div class="flex items-center gap-3"><span class="text-xs text-muted-foreground">Prototype · viewing as</span>
        <div class="k-role" role="group" aria-label="View the homepage as">
          <button type="button" data-action="role" data-role="applicant" aria-pressed="${state.role === "applicant"}">Applicant</button>
          <button type="button" data-action="role" data-role="manager" aria-pressed="${state.role === "manager"}">Hiring manager</button>
        </div></div>
    </div></header>`;
  }
  function homeTile(compact) {
    return `<div class="k-home-row"><button type="button" data-action="view" data-view="home" class="${cx("k-home", compact && "k-home-compact", state.view === "home" && "is-current")}"${state.view === "home" ? ' aria-current="page"' : ""}>
      ${icon("house")}<span>Home</span>${compact ? "" : "<small>You’re here</small>"}</button></div>`;
  }
  function subHeading(ic, eyebrow, title, lede) {
    return `<div class="k-subhead"><p class="k-eyebrow">${icon(ic)}${esc(eyebrow)}</p><h1 class="k-h1">${title}</h1>${lede ? `<p class="k-lede">${lede}</p>` : ""}</div>`;
  }

  /* ---------- Pages ---------- */
  function homePage() {
    const isApp = state.role === "applicant", other = them(), journey = JOURNEY[isApp ? "applicant" : "manager"];
    const current = journey.find((s) => s.current);
    const tile = (view, ic, title, sub, meta, badge) => `<button type="button" class="k-tile" data-action="view" data-view="${view}">
      <div class="k-tile-top"><span class="k-icon-tile">${icon(ic)}</span>${badge ? `<span class="k-badge">${badge}</span>` : ""}</div>
      <div><p class="k-tile-title">${title}</p><p class="k-tile-sub">${sub}</p></div>
      <p class="k-tile-meta">${meta}${icon("arrow-right", "k-tile-arrow size-4")}</p></button>`;
    return `<div class="k-greeting"><p class="k-eyebrow" style="justify-content:center">${icon("sparkles")}Your introduction is in progress</p>
        <h1>Welcome back, ${esc(first(me().name))}.</h1></div>
      <div class="k-tiles">
        ${tile("matches", "heart", "Your Matches", `Your current match is ${esc(other.name)}${other.company ? `, ${esc(other.company)}` : ""}.`, "See why you were matched", "1 current")}
        ${tile("outgoing", "send", "Outgoing Applications", esc(current ? current.title + "." : "Nothing in progress."), current ? esc(current.note) : "", isApp ? "Step 6 of 7" : "Step 6 of 8")}
        ${tile("profile", "profile-card", "Your Profile", "The card your match sees first: how you think and work, not a résumé.", "View your card", "Complete")}
        ${tile("settings", "settings", "Settings", "Notifications, what Katalyzr keeps, and opting out.", "Manage settings", "")}
      </div>
      ${homeTile(false)}`;
  }

  function matchesPage() {
    const isApp = state.role === "applicant", other = them(), o = overlap();
    const hl = new Set([...o.skills, ...o.values, ...o.style].map((x) => x.toLowerCase()));
    const why = (title, ic, items) => `<div class="k-panel"><p class="k-panel-title">${icon(ic)}${title} · ${items.length}</p>${items.length ? chips(items) : '<p class="text-sm text-muted-foreground">Complementary rather than shared</p>'}</div>`;
    return `${subHeading("heart", "Your matches", "Your Matches", `Every match is chosen by hand by Culminate Strategy Group. ${isApp ? "You can’t browse hiring managers" : "You can’t browse applicants"}: you get one introduction at a time.`)}
      <div class="k-two">
        <div>${profileCard(other, "Current match", hl)}</div>
        <div>
          <div class="k-panel">
            <p class="k-panel-title">${icon("sparkles")}Why you were matched</p>
            <p class="text-base leading-relaxed">${isApp ? `You and ${esc(first(other.name))} both run on candor and ownership, prefer written decisions over meetings, and stay calm when things get chaotic. That’s the mindset CSG looks for in a match.` : `${esc(first(other.name))} shares how you think: candor and ownership first, written decisions over meetings, and calm under pressure. That’s the mindset CSG looks for in a match.`}</p>
          </div>
          ${why("Overlapping skills", "puzzle", o.skills)}${why("Matching values", "heart", o.values)}${why("Working style & personality", "smile", o.style)}
          <div class="k-panel">
            <p class="k-panel-title">${icon("history")}Past matches</p>
            ${state.settings.keepHistory
              ? `<div class="k-empty">${icon("history", "size-6")}<p>No past matches yet. When an introduction ends, it’ll be kept here.</p></div>`
              : `<div class="k-empty">${icon("lock", "size-6")}<p>Katalyzr only keeps past matches if you opt in.</p><button type="button" class="k-link" data-action="view" data-view="settings">Turn on match history in Settings</button></div>`}
          </div>
        </div>
      </div>
      ${homeTile(true)}`;
  }

  function outgoingPage() {
    const isApp = state.role === "applicant", steps = JOURNEY[isApp ? "applicant" : "manager"];
    const items = steps.map((s, i) => {
      const status = s.done ? "is-done" : s.current ? "is-current" : "is-upcoming";
      let extra = "";
      if (s.decision) {
        // The yes / no only opens once the introduction before it is done
        const locked = !steps[i - 1].done;
        extra = state.decision
          ? `<p class="mt-2 flex items-center gap-2 text-sm font-semibold" style="color:var(--csg-navy)">${icon(state.decision === "yes" ? "circle-check" : "x", "size-4")}You said ${state.decision === "yes" ? "yes" : "no"} to Jordan. <button type="button" class="k-link" data-action="decision" data-value="">Undo</button></p>`
          : `<div class="mt-3 flex items-center gap-3"><button type="button" class="k-btn k-btn-coral" data-action="decision" data-value="yes"${locked ? " disabled" : ""}>${icon("check")}Yes, move forward</button><button type="button" class="k-btn k-btn-outline" data-action="decision" data-value="no"${locked ? " disabled" : ""}>${icon("x")}No, not this time</button></div>${locked ? `<p class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">${icon("lock", "size-3.5")}Unlocks after your conversation with Jordan</p>` : ""}`;
      }
      return `<li class="k-step ${status}"><span class="k-dot">${s.done ? icon("check") : i + 1}</span><div><p class="k-step-title">${esc(s.title)}</p><p class="k-step-note">${esc(s.note)}</p>${extra}</div></li>`;
    }).join("");
    return `${subHeading("send", "Outgoing applications", "Outgoing Applications", isApp ? "Where your introduction to Elena stands. Two conversations, then you’re done." : "Where your introduction to Jordan stands, and your yes or no at the end.")}
      <div class="k-two">
        <div class="k-panel">
          <p class="k-panel-title">${icon("calendar-check")}Next up</p>
          <div class="flex items-center gap-3">${avatar(PSYCH, "size-12 rounded-full")}<div><p class="font-semibold">${isApp ? "Your conversation with Dr. Marcus Hale" : "Jordan meets Dr. Marcus Hale"}</p><p class="text-sm text-muted-foreground">Thu, Nov 12 · 2:00 PM · in Katalyzr</p></div></div>
          <p class="mt-4 text-sm text-muted-foreground">${isApp ? "Not a test: Marcus is your advocate. Afterwards you approve the Mindset brief he shares with Elena." : "You’ll get Jordan’s approved Mindset brief before your own conversation."}</p>
        </div>
        <div class="k-panel"><p class="k-panel-title">${icon("send")}${isApp ? "Introduction with Elena Vasquez" : "Introduction with Jordan Ellis"}</p><ol class="k-timeline">${items}</ol></div>
      </div>
      ${homeTile(true)}`;
  }

  function profilePage() {
    return `${subHeading("profile-card", "Your profile", "Your Profile", `This is the card ${esc(first(them().name))} sees first. It describes how you think and work, not your résumé.`)}
      <div class="k-two">
        <div>${profileCard(me(), "You")}</div>
        <div>
          <div class="k-panel"><p class="k-panel-title">${icon("circle-check")}Card complete</p>
            <p class="text-base leading-relaxed">All 8 sections are filled in: photo, name and role, experience, key skills, values, working style, personality and mindset.</p></div>
          <div class="k-panel"><p class="k-panel-title">${icon("lock")}Who can see it</p>
            <p class="text-base leading-relaxed">Only your current match and Culminate Strategy Group. Katalyzr isn’t public, and nobody can browse cards.</p></div>
          ${state.role === "applicant" ? `<div class="k-panel"><p class="k-panel-title">${icon("history")}Next time</p><p class="text-base leading-relaxed">${state.settings.keepCard ? "Your card is saved, so if this introduction doesn’t work out you can skip straight to your next match." : "Your card won’t be kept after this introduction. You can change that in Settings."}</p></div>` : ""}
        </div>
      </div>
      ${homeTile(true)}`;
  }

  function settingsPage() {
    const sw = (key, title, text) => `<div class="k-setting"><div><p>${title}</p><p>${text}</p></div>
      <button type="button" role="switch" class="k-switch" aria-checked="${state.settings[key]}" aria-label="${esc(title)}" data-action="toggle" data-key="${key}"></button></div>`;
    return `${subHeading("settings", "Settings", "Settings", "Choose what Katalyzr keeps and how it reaches you. You can opt out at any time.")}
      <div class="k-panel"><p class="k-panel-title">${icon("bell")}Notifications</p>
        ${sw("email", "Email me about next steps", "Reminders before conversations and when it’s your turn to do something.")}</div>
      <div class="k-panel"><p class="k-panel-title">${icon("lock")}What Katalyzr keeps</p>
        ${sw("keepHistory", "Keep my match history", "Save past matches in Your Matches. Off unless you opt in.")}
        ${state.role === "applicant" ? sw("keepCard", "Keep my card for next time", "If this introduction doesn’t work out, skip building your card and go straight to your next match.") : ""}</div>
      <div class="k-panel k-danger"><p class="k-panel-title">${icon("log-out")}Opt out</p>
        <div class="k-setting"><div><p>Opt out of Katalyzr</p><p>Stop all introductions and contact. ${state.role === "applicant" ? "Your details won’t be shared with any hiring manager." : "No new applicants will be introduced to you."}</p></div>
          <button type="button" class="k-btn k-btn-outline" data-action="modal" data-modal="optout">${icon("log-out")}Opt out</button></div></div>
      ${homeTile(true)}`;
  }

  function optedOutPage() {
    return `<div class="k-greeting" style="max-width:36rem;margin:2rem auto"><span class="k-icon-tile" style="margin:0 auto 1.25rem;width:4rem;height:4rem">${icon("circle-check")}</span>
      <h1>You’ve opted out.</h1>
      <p class="k-lede" style="margin-left:auto;margin-right:auto">We won’t contact you about Katalyzr again${state.role === "applicant" ? ", and your details won’t be shared with any hiring manager" : " or introduce anyone new to you"}.</p>
      <div style="margin-top:1.75rem"><button type="button" class="k-btn k-btn-outline" data-action="undo-optout">${icon("rotate-ccw")}Changed your mind? Undo</button></div></div>`;
  }

  function modal() {
    if (state.modal !== "optout") return "";
    return `<div class="k-modal-backdrop" data-action="close-modal"></div>
      <div class="k-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <p class="k-eyebrow">${icon("log-out")}Opt out</p>
        <h2 id="modal-title" class="k-h1" style="font-size:1.9rem">Opt out of Katalyzr?</h2>
        <p class="k-lede">${state.role === "applicant" ? "We’ll stop contacting you, end your current introduction, and won’t share your details with any hiring manager." : "We’ll end your current introduction and won’t introduce any new applicants to you."}</p>
        <div class="k-modal-actions"><button type="button" class="k-btn k-btn-outline" data-action="close-modal">Cancel</button><button type="button" class="k-btn k-btn-navy" data-action="confirm-optout">${icon("log-out")}Opt out</button></div>
      </div>`;
  }

  /* ---------- Render ---------- */
  const root = document.getElementById("root");
  const PAGES = { home: homePage, matches: matchesPage, outgoing: outgoingPage, profile: profilePage, settings: settingsPage };
  function render() {
    const body = state.optedOut ? optedOutPage() : PAGES[state.view]();
    root.innerHTML = `<div class="k-page">${header()}<main class="k-main">${body}</main></div>${modal()}`;
  }

  /* ---------- Events ---------- */
  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const d = el.dataset;
    switch (d.action) {
      case "view": state.view = d.view; render(); return window.scrollTo({ top: 0 });
      case "role": state.role = d.role; return render();
      case "toggle": state.settings[d.key] = !state.settings[d.key]; return render();
      case "decision": state.decision = d.value || null; return render();
      case "modal": state.modal = d.modal; return render();
      case "close-modal": state.modal = null; return render();
      case "confirm-optout": state.modal = null; state.optedOut = true; return render();
      case "undo-optout": state.optedOut = false; state.view = "home"; return render();
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.modal) { state.modal = null; render(); } });

  render();
})();
