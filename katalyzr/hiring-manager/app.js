/* Katalyzr — Hiring Manager Prototype.
   The hiring manager's side of an introduction, built on the same engine, branding and sign-in page as the
   Applicant Prototype (../applicant/). Flow (from the "Hiring manager flow" board, updated to match the
   applicant prototype): sign in → personal invitation from Karrie → build your card (drafted from your
   episode) → define the role → flip to see the candidate CSG chose by hand → request the introduction →
   read the candidate's approved Mindset brief → book and hold the interview → yes / no → complete.
   No matching bot: Culminate Strategy Group chooses the match by hand. */
(function () {
  "use strict";

  /* ---------- Data ---------- */
  const STEPS = ["welcome", "build", "role", "match", "brief", "interview", "decision", "complete"];
  const STEP_LABELS = {
    welcome: "Welcome",
    build: "Build your card",
    role: "Define the role",
    match: "Flip to see your match",
    brief: "Read the Mindset brief",
    interview: "Interview with Jordan",
    decision: "Your decision",
    complete: "Introduction complete",
  };
  const PROGRESS = ["Invited", "Card complete", "Role defined", "Matched", "Brief read", "Interview", "Decision"];
  const PROGRESS_STEPS = ["welcome", "build", "role", "match", "brief", "interview", "decision"];

  // The hiring manager's own card (sample = Elena, who was on Uncommon Operator)
  const EMPTY_CARD = { photo: null, name: "", role: "", company: "", skills: [], experienceYears: "", experience: "", values: [], workingStyle: [], personality: [], mindset: "" };
  const SAMPLE_CARD = {
    photo: "images/hiring-manager.jpg",
    name: "Elena Vasquez",
    role: "Chief Operating Officer",
    company: "Halcyon Robotics",
    skills: ["Systems thinking", "Operations", "Product strategy", "Team building"],
    experienceYears: "16",
    experience: "Took Halcyon from prototype lab to 400 people across three factories.",
    values: ["Candor", "Ownership", "Craft", "Long-term thinking"],
    workingStyle: ["Async-first", "Written decisions", "High autonomy"],
    personality: ["Direct", "Warm", "Calm under pressure"],
    mindset: "Build calm companies in chaotic markets.",
  };
  // What Culminate drafts from the hiring manager's Uncommon Operator episode (they choose the rest)
  const EPISODE_DRAFT = ["photo", "name", "role", "company", "experienceYears", "experience", "values", "workingStyle"];
  // The candidate CSG chose by hand (the applicant from the Applicant Prototype)
  const MATCH = {
    photo: "images/applicant-sample.jpg",
    name: "Jordan Ellis",
    role: "Head of Operations",
    company: "Lumen Health",
    skills: ["Systems thinking", "Operations", "Team building", "Data analysis", "Negotiation"],
    experienceYears: "11",
    experience: "Scaled two healthtech startups from seed to Series C; built ops teams from 3 to 60.",
    values: ["Candor", "Ownership", "Curiosity", "Craft"],
    workingStyle: ["Async-first", "Written decisions", "Deep work blocks"],
    personality: ["Direct", "Calm under pressure", "Curious"],
    mindset: "Leave every system better than you found it.",
  };
  const PSYCH = { name: "Dr. Marcus Hale", title: "Talent Psychologist, CSG", credentials: "PhD, organizational psychology", photo: "images/psychologist.jpg" };
  const KARRIE = { name: "Karrie", title: "Host of Uncommon Operator · Culminate Strategy Group", photo: null };
  const PODCAST = "Uncommon Operator";

  // The role the hiring manager is hiring for
  const EMPTY_ROLE = { title: "", team: "", mustHaves: [], growth: "", purpose: "", arrangement: "" };
  const SAMPLE_ROLE = {
    title: "Director of Operations",
    team: "Operations · 12 people, reporting to you",
    mustHaves: ["Systems thinking", "Operations", "Team building"],
    growth: "Run operations for our third factory within 18 months, then help us open a fourth.",
    purpose: "Keep Halcyon calm and written-first while we triple in size.",
    arrangement: "Hybrid",
  };
  const ARRANGEMENTS = ["On-site", "Hybrid", "Remote"];

  const TECH_SKILLS = ["Systems thinking", "Operations", "Product strategy", "Go-to-market", "Data analysis", "Fundraising", "Engineering leadership", "Brand"];
  const PERSONAL_SKILLS = ["Team building", "Negotiation"];
  const VALUES = ["Candor", "Ownership", "Curiosity", "Craft", "Long-term thinking", "Generosity", "Speed", "Humility"];
  const WORKING_STYLES = ["Async-first", "Written decisions", "Deep work blocks", "High autonomy", "Highly collaborative", "In-person energy"];
  const PERSONALITIES = ["Direct", "Warm", "Calm under pressure", "Curious", "Playful", "Restless", "Reflective"];
  const HOW_IT_WORKS = [
    { title: "Build your card", body: "How you lead and work. We’ve drafted it from your episode.", icon: "profile-card" },
    { title: "Define the role", body: "What you need, and what growth looks like.", icon: "briefcase-business" },
    { title: "Meet one candidate", body: "Chosen by hand by Culminate. No stack of résumés.", icon: "user-round" },
    { title: "One conversation", body: "They talk with our psychologist first, then with you.", icon: "messages-square" },
  ];
  const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "";
  const INTERVIEW = {
    eyebrow: "Step 5 · The introduction",
    title: `Now, meet ${firstName(MATCH.name)}.`,
    description: "Marcus will open the call and introduce you both, then step back. About 45 minutes.",
    callTitle: `Katalyzr · Introduction with ${MATCH.name}`,
    remote: { name: MATCH.name, title: `${MATCH.role}, ${MATCH.company}`, photo: MATCH.photo },
    caption: "“I listened to your episode twice. The part about written decisions really stuck with me.”",
    agenda: ["A brief introduction from Marcus", `${firstName(MATCH.name)} on what they’ve built`, "Open conversation"],
    next: "decision",
  };
  const PASS_REASONS = ["Skills", "Culture", "Timing", "Something else"];

  /* ---------- Logic ---------- */
  function shared(a, b) {
    const set = new Set(b.map((x) => x.toLowerCase()));
    return a.filter((x) => set.has(x.toLowerCase()));
  }
  function connection(a, m) {
    const skills = shared(a.skills, m.skills), values = shared(a.values, m.values),
      workingStyle = shared(a.workingStyle, m.workingStyle), personality = shared(a.personality, m.personality);
    const hits = skills.length + values.length + workingStyle.length + personality.length;
    const total = m.skills.length + m.values.length + m.workingStyle.length + m.personality.length;
    const score = total === 0 ? 0 : Math.min(97, Math.round(58 + (hits / total) * 45));
    const highlight = new Set([...skills, ...values, ...workingStyle, ...personality].map((x) => x.toLowerCase()));
    return { skills, values, workingStyle, personality, score, highlight };
  }
  function checklist(a) {
    return [
      { label: "Photo", done: !!a.photo },
      { label: "Name & role", done: !!(a.name.trim() && a.role.trim()) },
      { label: "Experience", done: !!(a.experienceYears.trim() && a.experience.trim()) },
      { label: "Key skills", done: a.skills.length >= 2 },
      { label: "Values", done: a.values.length >= 2 },
      { label: "Working style", done: a.workingStyle.length >= 1 },
      { label: "Personality", done: a.personality.length >= 3 },
      { label: "Mindset", done: !!a.mindset.trim() },
    ];
  }
  function fmt(sec) {
    const t = Math.max(0, Math.floor(sec)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = String(t % 60).padStart(2, "0");
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
  }

  function roleChecklist(r) {
    return [
      { label: "Role title", done: !!r.title.trim() },
      { label: "Team", done: !!r.team.trim() },
      { label: "Must-haves", done: r.mustHaves.length >= 2 },
      { label: "Growth", done: !!r.growth.trim() },
      { label: "Purpose", done: !!r.purpose.trim() },
      { label: "Arrangement", done: !!r.arrangement },
    ];
  }

  /* ---------- State ---------- */
  const freshAccount = () => ({ signedIn: false, username: "", password: "", confirm: "", show: false, errors: {} });
  const state = {
    step: "welcome",
    card: { ...EMPTY_CARD }, // the hiring manager's own card
    role: { ...EMPTY_ROLE }, // the role they're hiring for
    showErrors: false, // build: highlight what's missing after a failed submit
    roleErrors: false, // role: same, for the role form
    chipDrafts: {},
    flipped: false, // match: has the candidate card been flipped over?
    modal: null, // "how", "optout", "request" (request the introduction), "pass" (not the right fit)
    draft: { imported: false }, // build: card filled from the episode draft
    booking: freshBookings(), // interview: the day and time picked
    optedOut: false,
    optOutReason: "",
    photoError: "",
    // Sign-in page. The password is never saved anywhere: only the username and "signed in".
    account: freshAccount(),
    intro: { requested: false, note: "" }, // match: introduction requested (Jordan accepts in the prototype)
    passed: { done: false, reason: "", note: "" }, // match: passed on this candidate
    briefRead: false, // brief: read Jordan's approved Mindset brief
    call: { joined: false, seconds: 0, mic: true, cam: true, captions: true },
    decision: { choice: null, reason: "", note: "", sent: false }, // decision: yes / no after the interview
  };
  function freshBookings() {
    const blank = () => ({ month: null, date: null, time: null, confirmed: false, skipped: false });
    return { interview: blank() };
  }
  let timers = [];
  const clearTimers = () => { timers.forEach((t) => clearInterval(t)); timers = []; };

  /* ---------- Saving progress (so a refresh doesn't send you back to the start) ---------- */
  // Prototype: progress is kept in this browser's localStorage. A real build would save it to the account.
  const SAVE_KEY = "katalyzr-manager-v1";
  const str = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));
  const strList = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []);
  // Turns anything (old saves, half-filled cards, bad data) into a card the screens can safely draw
  function cleanCard(a) {
    a = a && typeof a === "object" ? a : {};
    return {
      photo: typeof a.photo === "string" && a.photo ? a.photo : null,
      name: str(a.name), role: str(a.role), company: str(a.company),
      experienceYears: str(a.experienceYears), experience: str(a.experience),
      skills: strList(a.skills), customPersonalSkills: strList(a.customPersonalSkills),
      values: strList(a.values), workingStyle: strList(a.workingStyle), personality: strList(a.personality),
      mindset: str(a.mindset),
    };
  }
  function cleanRole(r) {
    r = r && typeof r === "object" ? r : {};
    return { title: str(r.title), team: str(r.team), mustHaves: strList(r.mustHaves), growth: str(r.growth), purpose: str(r.purpose), arrangement: ARRANGEMENTS.includes(r.arrangement) ? r.arrangement : "" };
  }
  function saveProgress() {
    try { writeProgress(); } catch (e) { console.warn("Katalyzr: couldn't save progress", e); }
  }
  function writeProgress() {
    const data = {
      step: state.step, card: state.card, role: state.role, flipped: state.flipped, draft: state.draft,
      booking: state.booking, optedOut: state.optedOut, optOutReason: state.optOutReason,
      intro: state.intro, passed: state.passed, briefRead: state.briefRead, decision: state.decision,
      account: { signedIn: state.account.signedIn, username: state.account.username }, // never the password
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); }
    catch (e) {
      // Storage full (usually a big uploaded photo): save everything except the photo
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, card: { ...data.card, photo: null } })); } catch (e2) { /* storage unavailable */ }
    }
  }
  function loadProgress() {
    let d;
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { d = null; }
    if (!d || typeof d !== "object") return;
    try {
      if (STEPS.includes(d.step)) state.step = d.step;
      state.card = cleanCard(d.card);
      state.role = cleanRole(d.role);
      state.flipped = d.flipped === true;
      state.draft = { imported: !!(d.draft && d.draft.imported === true) };
      const b = d.booking && d.booking.interview;
      if (b && typeof b === "object") {
        const okDate = typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date), okTime = SLOT_TIMES.includes(b.time);
        state.booking.interview = { month: typeof b.month === "string" ? b.month : null, date: okDate ? b.date : null, time: okTime ? b.time : null, confirmed: b.confirmed === true && okDate && okTime, skipped: b.skipped === true };
      }
      state.optedOut = d.optedOut === true;
      state.optOutReason = str(d.optOutReason);
      if (d.intro && typeof d.intro === "object") state.intro = { requested: d.intro.requested === true, note: str(d.intro.note) };
      if (d.passed && typeof d.passed === "object") state.passed = { done: d.passed.done === true, reason: PASS_REASONS.includes(d.passed.reason) ? d.passed.reason : "", note: str(d.passed.note) };
      state.briefRead = d.briefRead === true;
      if (d.decision && typeof d.decision === "object") state.decision = { choice: ["yes", "no"].includes(d.decision.choice) ? d.decision.choice : null, reason: PASS_REASONS.includes(d.decision.reason) ? d.decision.reason : "", note: str(d.decision.note), sent: d.decision.sent === true };
      if (d.account && typeof d.account === "object") { state.account.signedIn = d.account.signedIn === true; state.account.username = str(d.account.username); }
    } catch (e) {
      console.warn("Katalyzr: couldn't restore saved progress, starting fresh.", e);
    }
  }
  function clearProgress() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ } }

  function goTo(step) {
    const idx = STEPS.indexOf(step);
    // Jumping ahead (e.g. from the prototype dropdown) fills anything missing with the sample, so every page has something to show
    if (idx > STEPS.indexOf("build") && !checklist(state.card).every((c) => c.done)) {
      const filled = Object.fromEntries(Object.entries(state.card).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : !!v)));
      state.card = cleanCard({ ...SAMPLE_CARD, ...filled });
    }
    if (idx > STEPS.indexOf("role") && !roleChecklist(state.role).every((c) => c.done)) {
      const filled = Object.fromEntries(Object.entries(state.role).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : !!v)));
      state.role = cleanRole({ ...SAMPLE_ROLE, ...filled });
    }
    if (idx > STEPS.indexOf("match")) { state.intro.requested = true; state.passed.done = false; }
    if (idx > STEPS.indexOf("brief")) state.briefRead = true;
    state.step = step;
    state.showErrors = false;
    state.roleErrors = false;
    state.chipDrafts = {};
    state.flipped = step === "match" && state.intro.requested;
    state.modal = null;
    state.call = { joined: false, seconds: 0, mic: true, cam: true, captions: true };
    clearTimers();
    render(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateCard(patch) { state.card = { ...state.card, ...patch }; render(); }
  function updateRole(patch) { state.role = { ...state.role, ...patch }; render(); }
  function restart() {
    clearProgress();
    Object.assign(state, {
      account: freshAccount(), card: { ...EMPTY_CARD }, role: { ...EMPTY_ROLE }, flipped: false, draft: { imported: false },
      optedOut: false, optOutReason: "", intro: { requested: false, note: "" }, passed: { done: false, reason: "", note: "" },
      briefRead: false, booking: freshBookings(), decision: { choice: null, reason: "", note: "", sent: false },
    });
    goTo("welcome");
  }

  /* ---------- Helpers ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cx = (...a) => a.filter(Boolean).join(" ");
  let animate = false;
  const anim = (cls) => (animate ? cls : "");

  // Minimal stand-in for tailwind-merge: later classes replace earlier ones from the same group.
  function merge(cls) {
    const groupOf = (t) => {
      if (t.includes(":")) return null;
      let m = t.match(/^(h|w|px|py|gap|rounded)(-|$)/);
      if (m) return m[1];
      if (/^text-(xs|sm|base|lg|xl|\dxl|\[)/.test(t)) return "font-size";
      return null;
    };
    const out = [];
    cls.split(/\s+/).filter(Boolean).forEach((t) => {
      const g = groupOf(t);
      if (g) for (let i = out.length - 1; i >= 0; i--) if (groupOf(out[i]) === g) out.splice(i, 1);
      out.push(t);
    });
    return out.join(" ");
  }
  const BTN_BASE = "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
  const BTN_VARIANT = {
    default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
    outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
  };
  const BTN_SIZE = {
    default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
    lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  };
  function button({ variant = "default", size = "default", className = "", attrs = "", content }) {
    return `<button type="button" data-slot="button" class="${merge(cx(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className))}" ${attrs}>${content}</button>`;
  }

  /* ---------- Icons (lucide) ---------- */
  const ICONS = {
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    sparkles: '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
    upload: '<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    camera: '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>',
    "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    "rotate-cw": '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    pause: '<rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>',
    play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>',
    "calendar-check": '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    "video-off": '<path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><path d="m2 2 20 20"/>',
    captions: '<rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
    mic: '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
    "mic-off": '<path d="M12 19v3"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M16.95 16.95A7 7 0 0 1 5 12v-2"/><path d="M18.89 13.23A7 7 0 0 0 19 12v-2"/><path d="m2 2 20 20"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>',
    "phone-off": '<path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272"/><path d="M22 2 2 22"/><path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473"/>',
    // Custom: hiring manager — a person holding a clipboard (drawn in the Lucide style)
    "hiring-manager": '<circle cx="8" cy="6" r="3.5"/><path d="M2 21v-1.5A5.5 5.5 0 0 1 7.5 14H11"/><rect x="13" y="11" width="8" height="10.5" rx="1.5"/><path d="M15.5 10.5h3"/><path d="M15.5 15h3"/><path d="M15.5 18h3"/>',
    // Custom: profile card — a 16:9 sheet of paper (folded corner) with a person in the middle
    "profile-card": '<path d="M4 6.375h13.5L22 10.875v4.75a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.25a2 2 0 0 1 2-2z"/><path d="M17.5 6.375v3a1.5 1.5 0 0 0 1.5 1.5h3"/><circle cx="12" cy="10.4" r="2.1"/><path d="M8.6 15.6a3.4 3.4 0 0 1 6.8 0"/>',
    "messages-square": '<path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"/>',
    "mail-open": '<path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/>',
    "user-round": '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    "briefcase-business": '<path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
    lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
    handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
    brain: '<path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.707 6.294A3 3 0 1 0 12 5a3 3 0 1 0-5.707 1.294"/><path d="M17.996 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.465"/><path d="M19.967 17.482a4 4 0 1 1-7.967.517 4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.465"/><path d="M6.004 5.125a4 4 0 0 0-2.526 5.77"/>',
    "party-popper": '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',
    puzzle: '<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>',
    heart: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
    smile: '<path d="M15 10V9"/><path d="M16.472 15a6 6 0 0 1-8.943 0"/><path d="M9 10V9"/><circle cx="12" cy="12" r="10"/>',
    ear: '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    "circle-help": '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "log-out": '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
    house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    settings: '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
    // Custom: LinkedIn-style "in" badge
    linkedin: '<rect x="2.5" y="2.5" width="19" height="19" rx="4"/><path d="M8 11v6"/><path d="M8 7.5v.01"/><path d="M12 17v-6"/><path d="M12 13.5a2.5 2.5 0 0 1 5 0V17"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "list-checks": '<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>',
  };
  const icon = (name, cls = "") =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cx("lucide lucide-" + name, cls)}" aria-hidden="true">${ICONS[name]}</svg>`;

  // CSG logo mark (from culminatestrategy.com), drawn in currentColor
  const CSG_MARK = '<svg class="csg-logo" viewBox="12 12 83 87" fill="currentColor" aria-hidden="true"><path d="M88.2294 76.422C86.4259 79.2256 84.2551 81.809 81.8027 84.069C80.234 80.7079 78.0577 77.7398 75.4471 75.2555C80.2773 70.3397 83.2049 63.9559 83.7422 57.0278L83.9213 54.7017L59.9854 54.6862C57.598 54.6834 55.6612 56.619 55.6584 59.0055L79.1427 59.0191C78.2633 64.1478 75.806 68.8205 72.0791 72.5001C67.2981 69.1411 61.5248 67.1907 55.4034 67.1526C48.6359 67.1526 43.186 61.3902 43.706 54.5139C44.0898 49.4396 47.8171 45.0835 52.7859 43.9783C55.9592 43.2733 59.1355 43.8831 61.708 45.5265C63.5883 46.7292 66.0274 46.5821 67.741 45.1535C63.8531 40.4857 57.6524 38.3455 51.5044 39.8369C45.191 41.3693 40.3781 46.7428 39.5034 53.1808C38.1723 62.959 45.715 71.3633 55.2155 71.4722V71.4741C65.903 71.4741 75.413 78.2598 78.8821 88.3638L79.8724 91.2513L82.2662 89.3563C87.221 85.4369 91.3334 80.3844 94.1523 74.7475C92.04 73.6916 89.5068 74.438 88.2294 76.422Z"/><path d="M54.4907 79.7455C40.4509 79.7455 29.0742 68.1162 29.488 53.9838C29.8451 41.7951 39.1696 31.4652 51.263 29.9216C58.5299 28.9926 65.63 31.2373 70.9516 35.8953C72.6876 37.4173 75.2688 37.4466 77.041 35.9698C70.4966 28.1103 60.3701 24.1708 50.0312 25.7277C36.2015 27.81 25.6815 39.6703 25.1752 53.6449C24.5717 70.3153 37.9555 84.0676 54.4907 84.0676C59.9719 84.0676 64.5929 87.7745 65.8696 92.9355C62.5044 93.8674 59.0186 94.3369 55.4829 94.3369C33.5909 94.3369 15.8646 76.1607 16.6037 54.1055C17.2679 34.2388 33.148 17.8438 52.9875 16.6096C67.3935 15.7141 80.6913 22.6196 88.2456 34.4562C89.5111 36.4402 92.0478 37.1748 94.1524 36.1239C86.6114 21.0537 71.3056 11.815 54.4072 12.2241C31.0954 12.7872 12.2433 32.1453 12.259 55.462C12.2726 79.285 31.6581 98.659 55.4829 98.659C60.1012 98.659 64.6446 97.9352 68.9914 96.5049L70.6324 95.9643L70.4673 94.2444C69.672 85.9778 62.8025 79.7455 54.4907 79.7455Z"/></svg>';

  /* ---------- Shared components ---------- */
  // Round pink tile holding an icon (used in lists and section headings)
  const iconTile = (name, size = "size-10") =>
    `<span class="${cx("flex shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground", size)}">${icon(name, "size-5")}</span>`;
  // Icon shown next to each page's eyebrow label
  const STEP_ICONS = { build: "profile-card", role: "briefcase-business", match: "handshake", brief: "brain", interview: "video", decision: "circle-check", complete: "party-popper" };
  function pageHeading({ eyebrow, title, description }) {
    const ic = STEP_ICONS[state.step];
    return `<div class="mb-8 max-w-2xl">
      <p class="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${ic ? icon(ic, "size-4") : ""}${esc(eyebrow)}</p>
      <h1 class="font-serif text-5xl leading-[1.05] text-balance">${title}</h1>
      ${description ? `<p class="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">${esc(description)}</p>` : ""}
    </div>`;
  }
  function threeColumns(left, middle, right) {
    return `<div class="grid grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,360px)] items-start gap-8">
      <div>${left}</div><div class="self-stretch">${middle}</div><div>${right}</div></div>`;
  }
  function avatar(p, cls) {
    const initials = (p.name || "").split(" ").filter(Boolean).slice(0, 2).map((w) => (w[0] || "").toUpperCase()).join("") || "?";
    return `<div class="${cx("shrink-0 overflow-hidden bg-muted", cls)}">${
      p.photo ? `<img src="${esc(p.photo)}" alt="" class="size-full object-cover" data-fallback="${esc(initials)}">`
        : `<div class="flex size-full items-center justify-center font-medium text-muted-foreground">${esc(initials)}</div>`
    }</div>`;
  }
  function chip(label, isShared) {
    return `<li class="${cx("rounded-full border px-2.5 py-0.5 text-xs transition-colors", isShared ? "border-brass/60 bg-accent text-accent-foreground" : "bg-secondary/60 text-secondary-foreground")}">${isShared ? '<span class="sr-only">Shared: </span>' : ""}${esc(label)}</li>`;
  }
  const TRAIT_ICONS = { "Key skills": "puzzle", Values: "heart", "Working style": "compass", Personality: "smile", Mindset: "lightbulb" };
  const labelIcon = (title) => (TRAIT_ICONS[title] ? icon(TRAIT_ICONS[title], "size-3.5 text-brass") : "");
  function traitList(title, items, highlight, editing) {
    if (items.length === 0 && !editing) return "";
    return `<div>
      <p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${labelIcon(title)}${esc(title)}</p>
      <ul class="flex flex-wrap gap-1.5">${
        items.length === 0 ? '<li class="rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground/70">Not added yet</li>'
          : items.map((i) => chip(i, highlight && highlight.has(i.toLowerCase()))).join("")
      }</ul></div>`;
  }
  function profileCard(p, { label, variant = "full", highlight, editing = false, footer = "", className = "" }) {
    const sub = [p.role, p.company].filter(Boolean).join(" · ");
    if (variant === "compact") {
      return `<article aria-label="${esc(label)}: ${esc(p.name)}" class="${cx("flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm", anim("animate-in fade-in slide-in-from-left-4 duration-500"), className)}">
        ${avatar(p, "size-12 rounded-lg text-sm")}
        <div class="min-w-0">
          <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${esc(label)}</p>
          <p class="truncate font-serif text-xl leading-tight">${esc(p.name)}</p>
          <p class="truncate text-xs text-muted-foreground">${esc(sub)}</p>
        </div></article>`;
    }
    const showExp = p.experienceYears || p.experience || editing;
    return `<article aria-label="${esc(label)}: ${esc(p.name || "Your card")}" class="${cx("flex w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(60,40,10,0.18)]", className)}">
      <div class="relative aspect-[4/3] w-full bg-muted">
        ${p.photo ? `<img src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}" class="size-full object-cover" data-fallback="Photo unavailable">`
          : `<div class="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">${icon("camera", "size-6")}<span class="text-xs">${editing ? "Add a photo" : "No photo"}</span></div>`}
        <span class="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground backdrop-blur">${esc(label)}</span>
      </div>
      <div class="flex flex-col gap-4 p-5">
        <header>
          <h3 class="${cx("font-serif text-3xl leading-tight", !p.name && "text-muted-foreground/60")}">${esc(p.name || "Your name")}</h3>
          <p class="${cx("text-sm text-muted-foreground", !sub && "italic opacity-60")}">${esc(sub || "Current role")}</p>
          ${showExp ? `<p class="${cx("mt-2 text-sm leading-relaxed text-pretty", !p.experience && "text-muted-foreground/60 italic")}">${
            p.experienceYears ? `<span class="font-medium text-foreground not-italic">${esc(p.experienceYears)} yrs · </span>` : ""
          }${esc(p.experience || "Your experience in a sentence")}</p>` : ""}
        </header>
        ${traitList("Key skills", p.skills, highlight, editing)}
        ${traitList("Values", p.values, highlight, editing)}
        ${traitList("Working style", p.workingStyle, highlight, editing)}
        ${traitList("Personality", p.personality, highlight, editing)}
        <div>
          <p class="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${labelIcon("Mindset")}Mindset</p>
          <blockquote class="${cx("border-l-2 border-brass pl-3 font-serif text-lg italic leading-snug text-pretty", !p.mindset && "text-muted-foreground/60")}">${p.mindset ? `“${esc(p.mindset)}”` : "The belief that drives how you work"}</blockquote>
        </div>
      </div>
      ${footer}
    </article>`;
  }
  function connectionPanel(c, children) {
    const traits = [...c.workingStyle, ...c.personality];
    const circ = 2 * Math.PI * 44;
    const box = (title, items, ic) => `<div class="rounded-xl border bg-card/70 p-3">
      <p class="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon(ic, "size-3.5 text-brass")}${esc(title)} · ${items.length}</p>
      ${items.length > 0 ? `<ul class="flex flex-wrap justify-center gap-1.5">${items.map((i) => chip(i, true)).join("")}</ul>`
        : '<p class="text-xs text-muted-foreground">Complementary rather than shared</p>'}</div>`;
    return `<section aria-labelledby="connection-heading" class="relative flex h-full flex-col items-center px-2 pt-10 text-center">
      <div aria-hidden="true" class="absolute inset-x-0 top-[132px] flex items-center">
        <span class="size-2 rounded-full bg-brass"></span>
        <span class="h-px flex-1 bg-gradient-to-r from-brass to-transparent"></span>
        <span class="h-px flex-1 bg-gradient-to-l from-brass to-transparent"></span>
        <span class="size-2 rounded-full bg-brass"></span>
      </div>
      <h2 id="connection-heading" class="text-xs font-medium uppercase tracking-[0.18em] text-primary">What you share</h2>
      <div class="relative mt-5 flex size-28 items-center justify-center rounded-full bg-background">
        <svg viewBox="0 0 100 100" class="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="44" class="fill-none stroke-border" stroke-width="4"></circle>
          <circle cx="50" cy="50" r="44" class="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - c.score / 100)}"></circle>
        </svg>
        <div>
          <p class="font-serif text-4xl leading-none">${c.score}%</p>
          <p class="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Mindset fit</p>
        </div>
      </div>
      <div class="mt-8 flex w-full max-w-xs flex-col gap-5">
        ${box("Overlapping skills", c.skills, "puzzle")}${box("Matching values", c.values, "heart")}${box("Personality fit", traits, "smile")}
      </div>
      ${children ? `<div class="mt-8 w-full max-w-xs">${children}</div>` : ""}
    </section>`;
  }
  function goBetween(live, className) {
    return `<div class="${cx("inline-flex items-center gap-3 rounded-full border border-brass/50 bg-card py-1.5 pl-1.5 pr-4 shadow-sm", className)}">
      <div class="relative">${avatar(PSYCH, "size-10 rounded-full")}${live ? `<span class="absolute -right-0.5 -top-0.5 flex size-3"><span class="absolute inline-flex size-full animate-ping rounded-full bg-primary/60"></span><span class="relative inline-flex size-3 rounded-full border-2 border-card bg-primary"></span></span>` : ""}</div>
      <div class="text-left"><p class="text-sm font-medium leading-tight">${esc(PSYCH.name)}</p><p class="text-xs text-muted-foreground">Talent psychologist · CSG</p></div>
    </div>`;
  }

  /* ---------- Layout ---------- */
  function progressStage() {
    switch (state.step) {
      case "welcome": case "build": return 1;
      case "role": return 2;
      case "match": return state.intro.requested ? 4 : 3;
      case "brief": return 4;
      case "interview": return 5;
      case "decision": return 6;
      case "complete": return 7;
    }
  }
  function progressNav() {
    const s = progressStage();
    const canGoBack = (i) => i < s && PROGRESS_STEPS[i] !== state.step;
    const anyBack = PROGRESS.some((_, i) => canGoBack(i));
    const items = PROGRESS.map((label, i) => {
      const status = i < s ? "done" : i === s ? "current" : "upcoming";
      const back = canGoBack(i);
      const dot = `<span class="${cx("flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-colors",
        status === "done" && "border-primary bg-primary text-primary-foreground",
        status === "current" && "border-brass bg-accent text-accent-foreground ring-4 ring-accent/60",
        status === "upcoming" && "bg-card text-muted-foreground")}">${
        status === "done" ? icon("check", cx("size-3.5", back && "group-hover:hidden group-focus-visible:hidden")) + (back ? icon("arrow-left", "hidden size-3.5 group-hover:block group-focus-visible:block") : "") : i + 1
      }</span>`;
      const text = `<span class="${cx("whitespace-nowrap text-xs", status === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground",
        back && "text-primary underline decoration-primary/40 decoration-dotted underline-offset-4 group-hover:decoration-solid group-hover:decoration-primary")}">${esc(label)}<span class="sr-only"> (${status})</span></span>`;
      return `<li class="flex flex-1 items-center last:flex-none">${
        back ? `<button type="button" data-action="goto" data-step="${PROGRESS_STEPS[i]}" title="Go back to ${esc(label)}" class="group -mx-2 -my-1 flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">${dot}${text}</button>`
          : `<div class="flex items-center gap-2"${status === "current" ? ' aria-current="step"' : ""}>${dot}${text}</div>`
      }${i < PROGRESS.length - 1 ? `<span aria-hidden="true" class="${cx("mx-3 h-px flex-1 transition-colors", i < s ? "bg-primary" : "bg-border")}"></span>` : ""}</li>`;
    }).join("");
    return `<nav aria-label="Your progress" class="border-t bg-card">
      ${anyBack ? `<p class="mx-auto flex max-w-6xl items-center gap-1.5 px-8 pt-3 text-xs font-medium text-primary">${icon("arrow-left", "size-3.5")}Click any completed step to go back to it</p>` : ""}
      <ol class="${cx("mx-auto flex max-w-6xl items-center px-8 pb-4", anyBack ? "pt-2" : "pt-4")}">${items}</ol></nav>`;
  }
  function shell(content) {
    const onAccount = !state.account.signedIn;
    const prev = onAccount ? null : STEPS[STEPS.indexOf(state.step) - 1];
    return `<div class="flex min-h-screen min-w-[1200px] flex-col">
      <header class="csg-header border-b"><div class="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <div class="flex items-center gap-3">${CSG_MARK}<span class="font-serif text-2xl tracking-tight">Katalyzr</span><span class="text-xs text-muted-foreground">by Culminate Strategy Group</span></div>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">${icon("lock", "size-3")}${onAccount ? "Invite only" : "Private invitation · KTZ-HM-047"}</span>
          <label class="flex items-center gap-2 text-xs text-muted-foreground"><span>Hiring manager prototype</span>
            <select id="step-select" class="rounded-md border bg-card px-2 py-1 text-xs text-foreground">${
              `<option value="account"${onAccount ? " selected" : ""}>Sign in</option>` +
              STEPS.map((s, i) => `<option value="${s}"${!onAccount && s === state.step ? " selected" : ""}>${i}. ${esc(STEP_LABELS[s])}</option>`).join("")
            }</select></label>
        </div></div></header>
      <main class="flex flex-1 flex-col"><div class="${cx("mx-auto w-full max-w-7xl flex-1 px-8 py-10", anim("animate-in fade-in duration-500"))}">
        ${prev ? `<button type="button" data-action="goto" data-step="${prev}" class="group mb-6 inline-flex items-center gap-2 rounded-full border-2 border-primary/50 bg-card px-4 py-2 text-sm font-medium text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">${icon("arrow-left", "size-4 transition-transform group-hover:-translate-x-0.5")}Back to ${esc(STEP_LABELS[prev])}</button>` : ""}
        ${content}
      </div></main>
      ${onAccount || (state.optedOut && state.step === "welcome") ? "" : `<div class="sticky bottom-0 z-10">${progressNav()}</div>`}
    </div>`;
  }

  /* ---------- Screens ---------- */
  /* ---------- Sign in (the start page for everyone, before the personal invitation) ---------- */
  // Each invitation email explains who Culminate is and gives a username + password. Signing in with them
  // opens that person's personal invitation. Prototype: only Jordan's demo login exists.
  // The same sign-in page is used by applicants and hiring managers: the login says which one you are.
  // Prototype: these demo logins stand in for the ones sent in each invitation email.
  const THIS_ROLE = "manager";
  const LOGINS = {
    "jordan.ellis": { password: "Katalyzr2026", role: "applicant", url: "../applicant/" },
    "elena.vasquez": { password: "Katalyzr2026", role: "manager", url: "../hiring-manager/" },
  };
  const DEMO_LOGIN = { username: "elena.vasquez", password: LOGINS["elena.vasquez"].password }; // prototype only: "Fill as Elena"
  const HANDOFF_KEY = "katalyzr-signin-handoff"; // passes a sign-in to the other prototype for a moment
  function findLogin(acc) {
    const l = LOGINS[acc.username.trim().toLowerCase()];
    return l && l.password === acc.password ? l : null;
  }
  function signInProblems(acc) {
    const e = {};
    if (!acc.username.trim()) e.username = "Enter the username from your invitation email.";
    if (!acc.password) e.password = "Enter the password from your invitation email.";
    if (!e.username && !e.password && !findLogin(acc))
      e.form = "That username and password don’t match an invitation. Check your invitation email and try again.";
    return e;
  }
  // If someone signed in on the other prototype's page with a login for this one, pick it up
  function takeHandoff() {
    try {
      const h = JSON.parse(localStorage.getItem(HANDOFF_KEY));
      localStorage.removeItem(HANDOFF_KEY);
      if (h && h.role === THIS_ROLE && Date.now() - h.at < 120000) {
        state.account = { ...freshAccount(), signedIn: true, username: str(h.username) };
        state.step = "welcome";
        return true;
      }
    } catch (e) { /* storage unavailable */ }
    return false;
  }
  function accountScreen() {
    const acc = state.account, err = acc.errors || {}, type = acc.show ? "text" : "password";
    const fieldErr = (k) => (err[k] ? `<p class="text-sm" role="alert" style="color:var(--csg-coral-deep)">${esc(err[k])}</p>` : "");
    const step = (n, title, text) => `<li class="flex gap-4"><span class="k-step-n">${n}</span><div><p class="font-medium">${title}</p><p class="text-sm text-muted-foreground">${text}</p></div></li>`;
    return `<div class="grid grid-cols-[1.1fr_1fr] items-center gap-16 py-6">
      <section aria-labelledby="account-heading">
        <p class="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${icon("lock", "size-4")}Invite only</p>
        <h1 id="account-heading" class="font-serif text-6xl leading-[1.05] text-balance">Welcome to Katalyzr.</h1>
        <p class="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">Katalyzr is private. Sign in with the username and password from your invitation email to see your personal invitation.</p>
        <ol class="mt-8 flex max-w-md flex-col gap-5">
          ${step(1, "Find your invitation email", "It’s from Culminate Strategy Group, and it explains who we are and why you’re hearing from us.")}
          ${step(2, "Sign in with the details it gave you", "Your username and password are in the email.")}
          ${step(3, "See your personal invitation", "Once you’re in, we’ll tell you more: why we reached out to you, who you’ll meet, and what happens next.")}
        </ol>
      </section>
      <form id="account-form" class="flex flex-col gap-5 rounded-2xl border bg-card p-8 shadow-sm" novalidate>
        <div>
          <h2 class="font-serif text-3xl leading-tight">Sign in</h2>
          <p class="mt-1 text-sm text-muted-foreground">Use the details from your Katalyzr invitation email.</p>
        </div>
        ${err.form ? `<div class="k-error-box" role="alert">${icon("circle-help", "size-5")}<div><p class="text-sm">${esc(err.form)}</p></div></div>` : ""}
        <div class="flex flex-col gap-1.5">
          <label for="acc-username" class="text-sm font-medium">Username</label>
          <input id="acc-username" data-acc="username" autocomplete="username" value="${esc(acc.username)}"${err.username || err.form ? ' aria-invalid="true"' : ""} class="${cx(INPUT, (err.username || err.form) && INVALID)}">
          ${fieldErr("username")}
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="acc-password" class="text-sm font-medium">Password</label>
          <div class="k-pw"><input id="acc-password" data-acc="password" type="${type}" autocomplete="current-password" value="${esc(acc.password)}"${err.password || err.form ? ' aria-invalid="true"' : ""} class="${cx(INPUT, (err.password || err.form) && INVALID)}">
            <button type="button" data-action="acc-show" class="k-pw-toggle" aria-label="${acc.show ? "Hide password" : "Show password"}">${icon("eye", "size-4")}${acc.show ? "Hide" : "Show"}</button></div>
          ${fieldErr("password")}
        </div>
        <button type="submit" data-slot="button" class="${merge(cx(BTN_BASE, BTN_VARIANT.default, BTN_SIZE.lg, "csg-cta mt-2 h-12 w-full gap-2 rounded-full text-base"))}">Sign in${icon("arrow-right", "size-4")}</button>
        <p class="text-center text-xs text-muted-foreground">Can’t find your invitation email? Contact Culminate Strategy Group.</p>
        <!-- Prototype only: fills Elena's demo login from the invitation email. Remove for the final app. -->
        <button type="button" data-action="acc-fill" class="k-proto-skip self-center">${icon("sparkles", "size-3.5")}Prototype only · Fill as Elena</button>
      </form>
    </div>`;
  }
  function submitAccount() {
    const acc = state.account;
    acc.errors = signInProblems(acc);
    if (Object.keys(acc.errors).length) {
      render();
      const bad = document.querySelector('#account-form [aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    // An applicant's login: send them to the applicant prototype, already signed in
    const login = findLogin(acc);
    if (login.role !== THIS_ROLE) {
      try { localStorage.setItem(HANDOFF_KEY, JSON.stringify({ username: acc.username.trim().toLowerCase(), role: login.role, at: Date.now() })); } catch (e) { /* storage unavailable */ }
      acc.password = "";
      location.href = login.url;
      return;
    }
    // Prototype: the password is checked, then cleared right away. Only the username is kept.
    acc.username = acc.username.trim(); acc.password = ""; acc.confirm = ""; acc.show = false; acc.errors = {};
    acc.signedIn = true;
    goTo("welcome");
  }

  const INPUT = "w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary/15";
  const INVALID = "border-red-500 ring-2 ring-red-500";
  function chipPicker({ key, label, hint, options, selected, max, invalid }) {
    const full = selected.length >= max;
    const all = [...options, ...selected.filter((s) => !options.includes(s))];
    const draft = state.chipDrafts[key] || "";
    return `<fieldset class="${cx(invalid && "rounded-lg outline-2 outline-offset-4 outline-red-500")}">
      <div class="mb-2 flex items-baseline justify-between"><legend class="text-sm font-medium">${esc(label)}</legend><span class="text-xs text-muted-foreground">${selected.length}/${max} · ${esc(hint)}</span></div>
      <div class="flex flex-wrap gap-2">
        ${all.map((o) => {
          const on = selected.includes(o);
          return `<button type="button" data-action="chip" data-key="${key}" data-value="${esc(o)}" aria-pressed="${on}"${!on && full ? " disabled" : ""} class="${cx("flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-40", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/30 hover:bg-secondary")}">${on ? icon("check", "size-3.5") : ""}${esc(o)}</button>`;
        }).join("")}
        <div class="flex items-center rounded-full border border-dashed bg-card pl-3 pr-1 focus-within:border-primary">
          <label for="chip-${key}" class="sr-only">Add your own ${esc(label.toLowerCase())}</label>
          <input id="chip-${key}" data-chip-input="${key}" value="${esc(draft)}"${full ? " disabled" : ""} placeholder="Add your own" class="w-28 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-40">
          <button type="button" data-action="chip-add" data-key="${key}"${full || !draft.trim() ? " disabled" : ""} class="rounded-full p-1 text-muted-foreground hover:text-foreground disabled:opacity-40">${icon("plus", "size-4")}<span class="sr-only">Add</span></button>
        </div>
      </div></fieldset>`;
  }
  /* ---------- Hiring manager screens ---------- */
  function welcomeScreen() {
    const me = firstName(state.card.name) || firstName(SAMPLE_CARD.name);
    return `<div class="grid grid-cols-[1.1fr_1fr] items-center gap-16 py-6">
      <section aria-labelledby="welcome-heading">
        <p class="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${icon("mail-open", "size-4")}A personal invitation</p>
        <h1 id="welcome-heading" class="font-serif text-7xl leading-[1] text-balance">${esc(me)}, let’s find your <em class="text-primary">next great hire</em>.</h1>
        <div class="mt-8 max-w-xl space-y-4 text-lg leading-relaxed text-pretty">
          <p>Thank you for joining me on ${PODCAST}. You told me what kind of person you’d love to work with. Katalyzr is how Culminate introduces you to them.</p>
          <p class="text-muted-foreground">No job posting and no stack of résumés. One candidate, chosen by hand, who already shares how you see the world.</p>
        </div>
        <button type="button" data-action="modal" data-modal="how" class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">${icon("circle-help", "size-4")}How does Culminate find candidates?</button>
        <div class="mt-8 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-full bg-primary font-serif text-lg text-primary-foreground">K</div>
          <div><p class="font-serif text-xl italic leading-tight">${esc(KARRIE.name)}</p><p class="text-xs text-muted-foreground">${esc(KARRIE.title)}</p></div>
        </div>
        <div class="mt-10 flex items-center gap-6">
          ${button({ size: "lg", className: "csg-cta h-12 gap-2 rounded-full px-6 text-base", attrs: 'data-action="goto" data-step="build"', content: "Accept invitation" + icon("arrow-right", "size-4") })}
          <button type="button" data-action="modal" data-modal="optout" class="text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground">Not right now? Opt out</button>
        </div>
      </section>
      <aside aria-label="How it works" class="flex flex-col gap-8">
        <div class="relative mx-auto h-72 w-full max-w-md" aria-hidden="true">
          <div class="absolute left-6 top-6 h-64 w-48 -rotate-6 rounded-2xl border bg-card p-4 shadow-lg">
            <div class="h-28 rounded-lg bg-muted"></div><p class="mt-3 font-serif text-xl">You</p>
            <div class="mt-2 flex gap-1.5"><span class="h-4 w-12 rounded-full bg-secondary"></span><span class="h-4 w-16 rounded-full bg-accent"></span></div>
          </div>
          <div class="absolute right-6 top-0 h-64 w-48 rotate-6 rounded-2xl border border-dashed border-brass bg-card/60 p-4 shadow-lg">
            <div class="h-28 rounded-lg bg-accent/50"></div><p class="mt-3 font-serif text-xl text-muted-foreground">Your candidate</p>
            <div class="mt-2 flex gap-1.5"><span class="h-4 w-16 rounded-full bg-accent"></span><span class="h-4 w-10 rounded-full bg-secondary"></span></div>
          </div>
        </div>
        <ol class="flex flex-col gap-3">${HOW_IT_WORKS.map((h, i) => `<li class="flex items-center gap-4 rounded-xl border bg-card/70 p-4">
          <span class="csg-step-num font-serif text-3xl leading-none text-brass">${i + 1}</span>
          ${iconTile(h.icon)}
          <div><p class="font-medium">${esc(h.title)}</p><p class="text-sm text-muted-foreground">${esc(h.body)}</p></div></li>`).join("")}</ol>
      </aside>
    </div>`;
  }

  function optedOutScreen() {
    return `<section class="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
      ${iconTile("circle-check", "size-16")}
      <p class="mt-6 mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">Invitation declined</p>
      <h1 class="font-serif text-5xl leading-[1.05] text-balance">You’ve opted out.</h1>
      <p class="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">Thanks for letting us know. We won’t introduce any candidates to you, and nothing about you or your team will be shared. If the timing changes, Karrie is only an email away.</p>
      <div class="mt-8">${button({ variant: "outline", className: "h-11 gap-2 rounded-full px-5", attrs: 'data-action="undo-optout"', content: icon("rotate-ccw", "size-4") + "Changed your mind? Undo" })}</div>
    </section>`;
  }

  function modal() {
    if (!state.modal) return "";
    const close = `<button type="button" data-action="close-modal" class="k-modal-close rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close">${icon("x", "size-5")}</button>`;
    const item = (ic, title, text) => `<li class="flex gap-4">${iconTile(ic)}<div><p class="font-medium">${title}</p><p class="mt-1 text-sm leading-relaxed text-muted-foreground">${text}</p></div></li>`;
    const radios = (name, list, current) => `<div class="flex flex-col gap-2">${list.map((r, i) => `<label class="k-radio flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm hover:bg-secondary"><input type="radio" name="${name}" id="${name}-${i}" value="${esc(r)}"${current === r ? " checked" : ""}>${esc(r)}</label>`).join("")}</div>`;
    const cand = firstName(MATCH.name);
    let body = "";
    if (state.modal === "how") {
      body = `<p class="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">About your candidate</p>
        <h2 id="modal-title" class="font-serif text-3xl leading-tight">How Culminate finds your candidate</h2>
        <p class="mt-3 text-base leading-relaxed text-muted-foreground">You already know us through Karrie. Here’s how we find the person you’ll meet, and why you can trust the match.</p>
        <ol class="mt-6 flex flex-col gap-5">
          ${item("shield-check", "Found through LinkedIn’s official API", "Culminate finds people using LinkedIn’s approved APIs, within LinkedIn’s terms of service. No scraping, no bought lists.")}
          ${item("hiring-manager", "Chosen by a person, not an algorithm", `Someone at Culminate compares candidates with what you shared on ${PODCAST} and the role you define, then picks one.`)}
          ${item("circle-check", "They said yes too", "Your candidate accepted their own private invitation and built their own card. Nobody is introduced without agreeing to it.")}
          ${item("brain", "They talk with our psychologist first", "Dr. Marcus Hale meets them before you do. You get a short Mindset brief that the candidate has read and approved.")}
          ${item("eye", "Your details stay private", "Your card and role are only shared with the one candidate you’re introduced to. Nobody can browse Katalyzr.")}
        </ol>
        <div class="mt-8 flex items-center justify-end border-t pt-5">${button({ size: "lg", className: "csg-cta h-11 gap-2 rounded-full px-5", attrs: 'data-action="close-modal"', content: "Got it" })}</div>`;
    } else if (state.modal === "optout") {
      body = `<p class="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">Opt out</p>
        <h2 id="modal-title" class="font-serif text-3xl leading-tight">Opt out of Katalyzr?</h2>
        <p class="mt-3 text-base leading-relaxed text-muted-foreground">We won’t introduce any candidates to you, and nothing about you or your team will be shared.</p>
        <fieldset class="mt-6"><legend class="mb-3 text-sm font-medium">Mind telling us why? <span class="font-normal text-muted-foreground">(optional)</span></legend>
          ${radios("optout-reason", ["I’m not hiring right now", "I’ve already found someone", "This isn’t the right fit for me", "Something else"], state.optOutReason)}</fieldset>
        <div class="mt-8 flex items-center justify-end gap-3 border-t pt-5">
          ${button({ variant: "outline", className: "h-11 rounded-full px-5", attrs: 'data-action="close-modal"', content: "Keep my invitation" })}
          ${button({ size: "lg", className: "h-11 gap-2 rounded-full px-5", attrs: 'data-action="confirm-optout"', content: icon("log-out", "size-4") + "Opt out" })}
        </div>`;
    } else if (state.modal === "request") {
      body = `<p class="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${icon("send", "size-4")} Request the introduction</p>
        <h2 id="modal-title" class="font-serif text-3xl leading-tight">Ask to meet ${esc(cand)}</h2>
        <p class="mt-3 text-base leading-relaxed text-muted-foreground">${esc(cand)} will see your card and your note. Culminate makes the introduction once ${esc(cand)} accepts.</p>
        <div class="mt-6 flex flex-col gap-1.5">
          <label for="intro-note" class="text-sm font-medium">A note for ${esc(cand)} <span class="font-normal text-muted-foreground">(optional)</span></label>
          <textarea id="intro-note" rows="3" maxlength="280" class="${INPUT} resize-none" placeholder="e.g. I loved how you built your ops team from 3 to 60.">${esc(state.intro.note)}</textarea>
        </div>
        <div class="mt-8 flex items-center justify-end gap-3 border-t pt-5">
          ${button({ variant: "outline", className: "h-11 rounded-full px-5", attrs: 'data-action="close-modal"', content: "Cancel" })}
          ${button({ size: "lg", className: "csg-cta h-11 gap-2 rounded-full px-5", attrs: 'data-action="request-send"', content: icon("send", "size-4") + "Send request" })}
        </div>`;
    } else if (state.modal === "pass") {
      body = `<p class="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">Not the right fit?</p>
        <h2 id="modal-title" class="font-serif text-3xl leading-tight">Pass on ${esc(cand)}?</h2>
        <p class="mt-3 text-base leading-relaxed text-muted-foreground">Tell Culminate what didn’t fit, and they’ll use it to choose who to introduce next. ${esc(cand)} won’t see your reason.</p>
        <fieldset class="mt-6"><legend class="mb-3 text-sm font-medium">What didn’t fit?</legend>${radios("pass-reason", PASS_REASONS, state.passed.reason)}</fieldset>
        ${state.passErr ? `<p class="mt-2 text-sm" role="alert" style="color:var(--csg-coral-deep)">Pick a reason so Culminate knows what to look for next.</p>` : ""}
        <div class="mt-5 flex flex-col gap-1.5"><label for="pass-note" class="text-sm font-medium">Anything else? <span class="font-normal text-muted-foreground">(optional)</span></label>
          <textarea id="pass-note" rows="2" maxlength="280" class="${INPUT} resize-none">${esc(state.passed.note)}</textarea></div>
        <div class="mt-8 flex items-center justify-end gap-3 border-t pt-5">
          ${button({ variant: "outline", className: "h-11 rounded-full px-5", attrs: 'data-action="close-modal"', content: "Keep this match" })}
          ${button({ size: "lg", className: "h-11 gap-2 rounded-full px-5", attrs: 'data-action="pass-confirm"', content: "Pass on this match" })}
        </div>`;
    }
    return `<div class="k-modal-backdrop" data-action="close-modal"></div>
      <div class="k-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${close}${body}</div>`;
  }

  // Step 1: the hiring manager's own card (secondary to the role and the episode when CSG matches)
  function chipGroups() {
    const a = state.card;
    const custom = a.customPersonalSkills || [];
    const isPersonal = (s) => PERSONAL_SKILLS.includes(s) || custom.includes(s);
    const personal = a.skills.filter(isPersonal), tech = a.skills.filter((s) => !isPersonal(s));
    return {
      tech: { label: "Technical skills", hint: "up to 3", options: TECH_SKILLS, selected: tech, max: 3, invalid: a.skills.length < 2, set: (v) => updateCard({ skills: [...v, ...personal] }) },
      personal: { label: "Personal skills", hint: "up to 3", options: PERSONAL_SKILLS, selected: personal, max: 3, invalid: a.skills.length < 2, set: (v) => updateCard({ skills: [...tech, ...v], customPersonalSkills: v.filter((s) => !PERSONAL_SKILLS.includes(s)) }) },
      values: { label: "Values", hint: "pick at least 2", options: VALUES, selected: a.values, max: 4, invalid: a.values.length < 2, set: (v) => updateCard({ values: v }) },
      workingStyle: { label: "Working style", hint: "up to 3", options: WORKING_STYLES, selected: a.workingStyle, max: 3, invalid: a.workingStyle.length === 0, set: (v) => updateCard({ workingStyle: v }) },
      personality: { label: "Personality", hint: "pick 3–4", options: PERSONALITIES, selected: a.personality, max: 4, invalid: a.personality.length < 3, set: (v) => updateCard({ personality: v }) },
      mustHaves: { label: "Must-have skills", hint: "pick 2–4", options: [...TECH_SKILLS, ...PERSONAL_SKILLS], selected: state.role.mustHaves, max: 4, invalid: state.role.mustHaves.length < 2, set: (v) => updateRole({ mustHaves: v }) },
    };
  }
  const field = (label, id, input) => `<div class="flex flex-col gap-1.5"><label for="${id}" class="text-sm font-medium">${label}</label>${input}</div>`;
  const section = (title, body, ic) => `<section class="flex flex-col gap-5"><h2 class="flex items-center gap-3 font-serif text-2xl">${iconTile(ic)}${esc(title)}</h2>${body}</section>`;
  const checklistBox = (list) => {
    const done = list.filter((c) => c.done).length;
    return `<div class="rounded-xl border bg-card/70 p-4">
      <p class="mb-2 text-xs font-medium text-muted-foreground">${done} of ${list.length} complete</p>
      <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5">${list.map((c) => `<li class="${cx("flex items-center gap-1.5 text-xs", c.done ? "text-foreground" : "text-muted-foreground")}">
        <span class="${cx("flex size-4 items-center justify-center rounded-full border", c.done && "border-primary bg-primary text-primary-foreground")}">${c.done ? icon("check", "size-2.5") : ""}</span>${esc(c.label)}</li>`).join("")}</ul></div>`;
  };
  function buildScreen() {
    const a = state.card, list = checklist(a), ready = list.every((c) => c.done);
    const err = (bad) => state.showErrors && bad;
    const groups = chipGroups();
    const picker = (key) => chipPicker({ key, ...groups[key], invalid: err(groups[key].invalid) });
    return `<div>
      <div class="flex items-end justify-between">
        ${pageHeading({ eyebrow: "Step 1 · Build your card", title: "This is how you’ll be introduced.", description: "Your card is what your candidate sees first. Culminate also uses it, alongside your episode and the role you define, to choose who you meet." })}
        <div class="mb-8 flex items-center gap-3">
          ${button({ variant: "outline", className: "gap-2 rounded-full", attrs: 'data-action="fill-sample"', content: icon("sparkles", "size-4") + "Fill with sample" })}
          ${button({ size: "lg", className: "csg-cta gap-2 rounded-full px-4", attrs: 'data-action="draft-import"', content: icon("headphones", "size-4") + "Use my episode draft" })}
        </div>
      </div>
      <div class="grid grid-cols-[360px_minmax(0,1fr)] items-start gap-10">
        <div class="sticky top-6 flex flex-col gap-4">${profileCard(a, { label: "You · Live preview", editing: true })}${checklistBox(list)}</div>
        <form id="build-form" class="flex flex-col gap-8 rounded-2xl border bg-card p-8" novalidate>
          ${state.draft.imported ? `<div class="k-li-banner" role="status">${icon("headphones", "size-5")}<div><p class="font-medium">Drafted from your ${PODCAST} episode</p><p class="text-sm text-muted-foreground">We filled in your role, experience, values and working style from what you shared with Karrie. Fix anything that’s off, then choose your skills, personality and mindset. Those are yours to pick.</p></div><button type="button" data-action="draft-dismiss" class="rounded-full p-1 text-muted-foreground hover:text-foreground" aria-label="Dismiss">${icon("x", "size-4")}</button></div>` : ""}
          ${section("The basics", `
            <div class="${cx("flex items-center gap-4 rounded-lg", err(!a.photo) && "outline-2 outline-offset-4 outline-red-500")}">
              ${avatar(a, "size-16 rounded-full")}
              <div class="flex flex-wrap gap-2">
                <label for="f-photo" class="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-secondary focus-within:ring-3 focus-within:ring-primary/20">${icon("upload", "size-4")}Upload photo<input id="f-photo" type="file" accept="image/*" class="sr-only"></label>
                <button type="button" data-action="sample-photo" class="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Use sample photo</button>
              </div>
            </div>
            ${state.photoError ? `<p class="text-sm" role="alert" style="color:var(--csg-coral-deep)">${esc(state.photoError)}</p>` : ""}
            <div class="grid grid-cols-2 gap-4">
              ${field("Full name", "f-name", `<input id="f-name" data-field="name" class="${cx(INPUT, err(!a.name.trim()) && INVALID)}" value="${esc(a.name)}" autocomplete="name">`)}
              ${field("Your title", "f-role", `<input id="f-role" data-field="role" class="${cx(INPUT, err(!a.role.trim()) && INVALID)}" value="${esc(a.role)}" autocomplete="organization-title">`)}
            </div>
            ${field("Company", "f-company", `<input id="f-company" data-field="company" class="${INPUT}" value="${esc(a.company)}" autocomplete="organization">`)}`, "user-round")}
          ${section("Experience", `
            <div class="grid grid-cols-[120px_minmax(0,1fr)] gap-4">
              ${field("Years", "f-years", `<input id="f-years" data-field="experienceYears" type="number" min="0" max="60" inputmode="numeric" class="${cx(INPUT, err(!a.experienceYears.trim()) && INVALID)}" value="${esc(a.experienceYears)}">`)}
              ${field("In one sentence, what have you built?", "f-exp", `<input id="f-exp" data-field="experience" maxlength="140" class="${cx(INPUT, err(!a.experience.trim()) && INVALID)}" value="${esc(a.experience)}">`)}
            </div>
            ${picker("tech")}${picker("personal")}`, "briefcase-business")}
          ${section("How you lead and work", picker("values") + picker("workingStyle") + picker("personality"), "compass")}
          ${section("Mindset", field("The belief that drives how you lead", "f-mindset", `<textarea id="f-mindset" data-field="mindset" rows="2" maxlength="100" class="${cx(INPUT, "resize-none font-serif text-lg italic", err(!a.mindset.trim()) && INVALID)}">${esc(a.mindset)}</textarea>`), "lightbulb")}
          <div class="flex items-center justify-between border-t pt-6">
            <p class="text-sm text-muted-foreground">${ready ? "Your card is ready." : "Complete every section to continue."}</p>
            <button type="submit" data-slot="button" class="${merge(cx(BTN_BASE, BTN_VARIANT.default, BTN_SIZE.lg, "csg-cta h-11 gap-2 rounded-full px-5"))}">Next: define the role${icon("arrow-right", "size-4")}</button>
          </div>
        </form>
      </div></div>`;
  }

  // Step 2: the role (the main thing Culminate matches on, with the episode)
  function roleCard(r) {
    const row = (ic, label, value) => `<div><p class="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon(ic, "size-3.5 text-brass")}${label}</p><p class="${cx("text-sm leading-relaxed", !value && "italic text-muted-foreground/60")}">${esc(value || "Not added yet")}</p></div>`;
    return `<article aria-label="The role" class="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(60,40,10,0.18)]">
      <div><p class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">The role · Live preview</p>
        <h3 class="${cx("mt-1 font-serif text-3xl leading-tight", !r.title && "text-muted-foreground/60")}">${esc(r.title || "Role title")}</h3>
        <p class="text-sm text-muted-foreground">${esc([state.card.company || SAMPLE_CARD.company, r.arrangement].filter(Boolean).join(" · "))}</p></div>
      ${row("user-round", "Team", r.team)}
      <div><p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon("puzzle", "size-3.5 text-brass")}Must-haves</p>
        <ul class="flex flex-wrap gap-1.5">${r.mustHaves.length ? r.mustHaves.map((m) => chip(m, false)).join("") : '<li class="rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground/70">Not added yet</li>'}</ul></div>
      ${row("sparkles", "What growth looks like", r.growth)}
      ${row("heart", "Why it matters", r.purpose)}
    </article>`;
  }
  function roleScreen() {
    const r = state.role, list = roleChecklist(r), ready = list.every((c) => c.done);
    const err = (bad) => state.roleErrors && bad;
    const g = chipGroups().mustHaves;
    return `<div>
      ${pageHeading({ eyebrow: "Step 2 · Define the role", title: "Who are you hoping to meet?", description: "Culminate matches on the role first, together with what you shared on Uncommon Operator. Your candidate sees this before your conversation." })}
      <div class="grid grid-cols-[360px_minmax(0,1fr)] items-start gap-10">
        <div class="sticky top-6 flex flex-col gap-4">${roleCard(r)}${checklistBox(list)}</div>
        <form id="role-form" class="flex flex-col gap-8 rounded-2xl border bg-card p-8" novalidate>
          ${section("The role", `
            <div class="grid grid-cols-2 gap-4">
              ${field("Role title", "r-title", `<input id="r-title" data-role-field="title" class="${cx(INPUT, err(!r.title.trim()) && INVALID)}" value="${esc(r.title)}" placeholder="e.g. Director of Operations">`)}
              ${field("Team", "r-team", `<input id="r-team" data-role-field="team" class="${cx(INPUT, err(!r.team.trim()) && INVALID)}" value="${esc(r.team)}" placeholder="e.g. Operations · 12 people">`)}
            </div>
            <fieldset class="${cx(err(!r.arrangement) && "rounded-lg outline-2 outline-offset-4 outline-red-500")}"><legend class="mb-2 text-sm font-medium">How you’ll work together</legend>
              <div class="flex flex-wrap gap-2">${ARRANGEMENTS.map((o) => { const on = r.arrangement === o; return `<button type="button" data-action="arrangement" data-value="${o}" aria-pressed="${on}" class="${cx("flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/30 hover:bg-secondary")}">${on ? icon("check", "size-3.5") : ""}${o}</button>`; }).join("")}</div></fieldset>`, "briefcase-business")}
          ${section("What they need to bring", chipPicker({ key: "mustHaves", ...g, invalid: err(g.invalid) }), "puzzle")}
          ${section("Growth and purpose", `
            ${field("What does growth look like in this role?", "r-growth", `<textarea id="r-growth" data-role-field="growth" rows="2" maxlength="200" class="${cx(INPUT, "resize-none", err(!r.growth.trim()) && INVALID)}" placeholder="e.g. Run a second site within 18 months.">${esc(r.growth)}</textarea>`)}
            ${field("Why does this role matter?", "r-purpose", `<textarea id="r-purpose" data-role-field="purpose" rows="2" maxlength="200" class="${cx(INPUT, "resize-none", err(!r.purpose.trim()) && INVALID)}" placeholder="e.g. Keep us calm and written-first while we scale.">${esc(r.purpose)}</textarea>`)}`, "sparkles")}
          <div class="flex items-center justify-between border-t pt-6">
            <p class="text-sm text-muted-foreground">${ready ? "Your role is ready." : "Complete every section to see your match."}</p>
            <div class="flex items-center gap-3">
              ${button({ variant: "outline", className: "h-11 gap-2 rounded-full", attrs: 'data-action="role-sample"', content: icon("sparkles", "size-4") + "Fill with sample" })}
              <button type="submit" data-slot="button" class="${merge(cx(BTN_BASE, BTN_VARIANT.default, BTN_SIZE.lg, "csg-cta h-11 gap-2 rounded-full px-5"))}">See my match${icon("arrow-right", "size-4")}</button>
            </div>
          </div>
        </form>
      </div></div>`;
  }

  // Step 3: CSG has chosen one candidate by hand. Flip to see them, then request the introduction (or pass).
  function matchScreen() {
    if (state.passed.done) return passedScreen();
    const c = connection(state.card, MATCH), cand = firstName(MATCH.name), flipped = state.flipped || state.intro.requested;
    const front = `<button type="button" data-action="flip" class="flip-front flex w-full flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-brass/60 bg-card p-8 text-center shadow-sm" aria-label="Flip this card to see your candidate">
        <span class="flex size-16 items-center justify-center rounded-full bg-accent">${icon("user-round", "size-7 text-accent-foreground")}</span>
        <div><p class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Your candidate</p>
          <p class="mt-2 font-serif text-2xl leading-tight text-balance">Flip this card to see your candidate!</p></div>
        <p class="text-sm text-muted-foreground">Chosen by hand by Culminate Strategy Group</p>
        <span class="flip-hint flex items-center gap-1.5 text-xs font-medium text-primary">${icon("rotate-cw", "size-3.5")}Click to flip</span>
      </button>`;
    const back = `<div class="flip-back">${profileCard(MATCH, { label: "Your candidate", highlight: c.highlight })}</div>`;
    const actions = state.intro.requested
      ? `<div class="k-li-banner" role="status">${icon("circle-check", "size-5")}<div class="text-left"><p class="font-medium">${esc(cand)} accepted your introduction</p><p class="text-sm text-muted-foreground">Next, ${esc(cand)} talks with Dr. Marcus Hale. You’ll get the Mindset brief ${esc(cand)} approves.</p></div></div>
         ${button({ size: "lg", className: "csg-cta mt-4 h-11 w-full gap-2 rounded-full", attrs: 'data-action="goto" data-step="brief"', content: `Read ${esc(cand)}’s Mindset brief` + icon("arrow-right", "size-4") })}`
      : `${button({ size: "lg", className: "csg-cta h-11 w-full gap-2 rounded-full", attrs: 'data-action="modal" data-modal="request"', content: icon("send", "size-4") + `Request an introduction` })}
         <button type="button" data-action="modal" data-modal="pass" class="mt-3 w-full text-center text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground">Not the right fit? Pass</button>`;
    const trust = (ic, title, text) => `<div class="rounded-xl border bg-card/70 p-4">${iconTile(ic)}<p class="mt-3 font-medium">${title}</p><p class="mt-1 text-sm text-muted-foreground">${text}</p></div>`;
    return `<div>
      ${pageHeading({ eyebrow: "Step 3 · Your match", title: flipped ? `Meet <em class="text-primary">${esc(MATCH.name)}</em>.` : "Your candidate is ready.", description: flipped ? `${esc(cand)} runs operations at ${esc(MATCH.company)}. Highlighted traits are the ones you share.` : "Culminate chose one person for you by hand, based on your episode, your card and the role. There’s no list to scroll through." })}
      ${threeColumns(
        profileCard(state.card, { label: "You", highlight: flipped ? c.highlight : null }),
        flipped
          ? safe("connection panel", () => connectionPanel(c, actions))
          : `<div class="flex h-full flex-col items-center pt-32 text-center">
              <div class="flex w-full items-center" aria-hidden="true"><span class="size-2 rounded-full bg-brass"></span><span class="h-px flex-1 bg-gradient-to-r from-brass to-transparent"></span><span class="h-px flex-1 bg-gradient-to-l from-brass to-transparent"></span><span class="size-2 rounded-full bg-brass"></span></div>
              <p class="mt-6 max-w-xs text-sm text-muted-foreground">Your candidate is waiting on the other side of the card.</p></div>`,
        `<div class="${cx("flip-card", flipped && "is-flipped")}"><div class="flip-inner">${front}${back}</div></div>`
      )}
      ${flipped ? `<div class="mt-10"><p class="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${icon("shield-check", "size-4")}How we found ${esc(cand)}</p>
        <div class="grid grid-cols-3 gap-4">
          ${trust("shield-check", "Through LinkedIn’s official API", `Culminate found ${esc(cand)}’s public professional profile within LinkedIn’s terms. No scraping, no bought lists.`)}
          ${trust("circle-check", `${esc(cand)} chose to be here`, `${esc(cand)} accepted a private invitation and built this card. Nobody is introduced without agreeing to it.`)}
          ${trust("brain", "A psychologist meets them first", `Before you meet, ${esc(cand)} talks with Dr. Marcus Hale and approves a short Mindset brief for you.`)}
        </div></div>` : ""}
    </div>`;
  }
  function passedScreen() {
    return `<section class="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
      ${iconTile("circle-check", "size-16")}
      <p class="mt-6 mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">Match passed</p>
      <h1 class="font-serif text-5xl leading-[1.05] text-balance">Thanks for being honest.</h1>
      <p class="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">Culminate will use what you shared${state.passed.reason ? ` (${esc(state.passed.reason.toLowerCase())})` : ""} to choose who to introduce next. ${esc(firstName(MATCH.name))} won’t see your reason. We’ll be in touch when your next candidate is ready.</p>
      <div class="mt-8">${button({ variant: "outline", className: "h-11 gap-2 rounded-full px-5", attrs: 'data-action="pass-undo"', content: icon("rotate-ccw", "size-4") + "Changed your mind? Undo" })}</div>
    </section>`;
  }

  // Step 4: the candidate's progress and the Mindset brief they approved
  function advocateCard() {
    const row = (ok, text) => `<li class="flex items-start gap-2">${icon(ok ? "check" : "x", cx("mt-0.5 size-3.5 shrink-0", ok ? "text-primary" : "text-brass"))}${esc(text)}</li>`;
    return `<div class="rounded-xl border bg-card p-4">
      <p class="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon("shield-check", "size-3.5 text-brass")}Who wrote the brief</p>
      <div class="flex items-center gap-3">${avatar(PSYCH, "size-12 rounded-full")}<div><p class="font-serif text-lg leading-tight">${esc(PSYCH.name)}</p><p class="text-xs text-muted-foreground">${esc(PSYCH.credentials)}</p></div></div>
      <p class="mt-3 text-xs font-medium">He does</p>
      <ul class="mt-1 flex flex-col gap-1 text-sm">${row(true, `Meet ${firstName(MATCH.name)} before you do`)}${row(true, "Share only what the candidate approved")}${row(true, "Open your call, then step back")}</ul>
      <p class="mt-3 text-xs font-medium">He doesn’t</p>
      <ul class="mt-1 flex flex-col gap-1 text-sm">${row(false, "Score or rank candidates")}${row(false, "Make the decision for you")}</ul>
    </div>`;
  }
  function briefPoints() {
    const a = MATCH, c = connection(state.card, MATCH), who = firstName(a.name);
    const lower = (arr) => arr.map((x) => x.toLowerCase());
    const join = (arr) => (arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1]);
    const sharedList = [...c.values, ...c.workingStyle];
    return [
      { ic: "compass", title: `How ${who} works`, text: `Does their best work with ${join(lower(a.workingStyle))}. Comes across as ${join(lower(a.personality))}.` },
      { ic: "lightbulb", title: "What drives them", text: `“${a.mindset}” — ${who} came back to this idea several times in our conversation.` },
      { ic: "headphones", title: "What stayed with them from your episode", text: "Your point about calm being a competitive advantage. They asked how you keep decisions written down as the company grows." },
      { ic: "handshake", title: "Where you two will click", text: sharedList.length ? `You both care about ${join(lower(sharedList))}. Expect a conversation that gets specific fast.` : "Different strengths that complement each other well." },
    ];
  }
  function briefScreen() {
    const cand = firstName(MATCH.name);
    const steps = [`Accepted the invitation`, "Built their card", `Listened to your ${PODCAST} episode`, `Talked with ${PSYCH.name}`, "Approved this Mindset brief"];
    return `<div>
      ${pageHeading({ eyebrow: "Step 4 · Before you meet", title: `Read ${esc(cand)}’s Mindset brief.`, description: `${cand} talked with Dr. Marcus Hale and approved this brief for you. It’s the only thing Marcus shares from that conversation.` })}
      <div class="grid grid-cols-[280px_minmax(0,1fr)] items-start gap-8">
        <aside aria-label="Who's here" class="flex flex-col gap-3">
          ${profileCard(MATCH, { label: "Your candidate", variant: "compact" })}
          ${profileCard(state.card, { label: "You", variant: "compact" })}
          <div class="mt-2 rounded-xl border bg-card/70 p-4">
            <p class="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon("list-checks", "size-3.5 text-brass")}${esc(cand)} so far</p>
            <ol class="flex flex-col gap-2 text-sm">${steps.map((s) => `<li class="flex items-start gap-2">${icon("check", "mt-0.5 size-3.5 shrink-0 text-primary")}${esc(s)}</li>`).join("")}</ol>
          </div>
          ${advocateCard()}
        </aside>
        ${safe("Mindset brief", () => `<section aria-label="${esc(cand)}’s Mindset brief" class="rounded-2xl border bg-card p-8">
          <p class="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${icon("circle-check", "size-4")}Approved by ${esc(cand)}</p>
          <h2 class="font-serif text-3xl leading-tight">${esc(cand)}’s Mindset brief</h2>
          <p class="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">Written by Marcus from his conversation with ${esc(cand)}, and read and approved by ${esc(cand)} before it reached you.</p>
          <div class="mt-6 rounded-xl border-l-4 border-brass bg-secondary/50 p-6">
            <div class="mb-4 flex items-center justify-between text-xs text-muted-foreground"><span class="font-medium uppercase tracking-[0.14em]">Mindset brief · ${esc(MATCH.name)}</span><span>Prepared by ${esc(PSYCH.name)}</span></div>
            <ul class="flex flex-col gap-4">${briefPoints().map((p) => `<li class="flex gap-4">${iconTile(p.ic)}<div><p class="font-medium">${esc(p.title)}</p><p class="mt-0.5 text-sm leading-relaxed text-muted-foreground">${esc(p.text)}</p></div></li>`).join("")}</ul>
          </div>
          ${state.intro.note ? `<p class="mt-4 text-sm text-muted-foreground"><span class="font-medium text-foreground">Your note to ${esc(cand)}:</span> “${esc(state.intro.note)}”</p>` : ""}
          <div class="mt-6 flex items-center justify-between border-t pt-6">
            <p class="text-sm text-muted-foreground">Next, pick a time for your conversation.</p>
            ${button({ size: "lg", className: "csg-cta h-11 gap-2 rounded-full px-5", attrs: 'data-action="brief-read"', content: `Book time with ${esc(cand)}` + icon("arrow-right", "size-4") })}
          </div>
        </section>`)}
      </div></div>`;
  }

  // Step 5: book the interview, then hold it (Marcus opens the call, then steps back)
  function interviewScreen() {
    const cfg = INTERVIEW, kind = "interview", b = state.booking[kind], hl = connection(state.card, MATCH).highlight;
    return `<div>
      <div class="flex items-end justify-between">${pageHeading({ eyebrow: cfg.eyebrow, title: esc(cfg.title), description: cfg.description })}${goBetween(state.call.joined, "mb-8")}</div>
      <div class="grid grid-cols-[280px_minmax(0,1fr)] items-start gap-8">
        <aside aria-label="Who's here" class="flex flex-col gap-3">
          ${profileCard(state.card, { label: "You", variant: "compact" })}
          ${profileCard(MATCH, { label: "Your candidate", variant: "compact" })}
          <div class="mt-2 rounded-xl border bg-card/70 p-4">
            <p class="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon("list-checks", "size-3.5 text-brass")}What you'll cover</p>
            <ol class="flex flex-col gap-2 text-sm">${cfg.agenda.map((x, i) => `<li class="flex gap-2"><span class="font-serif text-brass">${i + 1}.</span>${esc(x)}</li>`).join("")}</ol>
          </div>
          <p class="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">${icon("sparkles", "size-3.5 text-brass")}${hl.size} shared traits on your cards</p>
          <p class="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">${icon("circle-check", "size-3.5 text-primary")}You’ve read ${esc(firstName(MATCH.name))}’s Mindset brief</p>
        </aside>
        ${state.call.joined ? safe("video call", () => videoCall(cfg)) : !b.confirmed ? safe("booking calendar", () => bookingCalendar(kind, cfg)) : `<section aria-label="Join the call" class="flex aspect-video flex-col items-center justify-center gap-6 rounded-2xl border bg-card p-10 text-center">
          <div class="flex items-center -space-x-4">
            ${avatar(state.card, "size-20 rounded-full border-4 border-card")}${avatar(MATCH, "size-20 rounded-full border-4 border-card")}${avatar(PSYCH, "size-20 rounded-full border-4 border-card")}
          </div>
          <div>
            <p class="flex items-center justify-center gap-2 text-sm text-muted-foreground">${icon("calendar-check", "size-4")}Booked for ${esc(prettyDay(b.date))} · ${b.time} CT</p>
            <p class="mt-2 font-serif text-3xl">${callIsOpen(kind) ? `It’s time. ${esc(firstName(MATCH.name))} and Marcus are ready.` : `You’re booked with ${esc(MATCH.name)}.`}</p>
            <p class="mt-2 text-sm text-muted-foreground">${callIsOpen(kind) ? "Join whenever you’re ready." : `The call opens at ${b.time} on ${esc(prettyDay(b.date))}. We’ll email a reminder the day before.`}</p>
          </div>
          <div class="flex items-center gap-3">
            ${button({ size: "lg", className: cx("h-12 gap-2 rounded-full px-6 text-base", callIsOpen(kind) && "csg-cta"), attrs: `data-action="join"${callIsOpen(kind) ? "" : ' disabled title="Opens at your booked time"'}`, content: icon(callIsOpen(kind) ? "video" : "lock", "size-4") + "Join video call" })}
            ${button({ variant: "outline", className: "h-12 gap-2 rounded-full px-5 text-base", attrs: `data-action="cal-reschedule" data-kind="${kind}"`, content: icon("calendar-check", "size-4") + "Change date" })}
          </div>
          ${callIsOpen(kind) ? "" : `<!-- Prototype only: jump to the booked time so nobody has to wait. Remove for the final app. -->
          <button type="button" data-action="cal-skip" data-kind="${kind}" class="k-proto-skip">${icon("clock", "size-3.5")}Prototype only · Skip to time</button>`}
        </section>`}
      </div></div>`;
  }

  // Step 6: yes / no after the interview (a no asks for a reason: skills, culture or timing)
  function decisionScreen() {
    const d = state.decision, cand = firstName(MATCH.name);
    const option = (value, ic, title, text) => `<button type="button" data-action="decide" data-value="${value}" aria-pressed="${d.choice === value}" class="${cx("k-choice", d.choice === value && "is-selected")}">${iconTile(ic, "size-12")}<span><span class="block font-serif text-2xl leading-tight">${title}</span><span class="mt-1 block text-sm text-muted-foreground">${text}</span></span></button>`;
    let follow = "";
    if (d.choice === "yes") {
      follow = `<div class="flex flex-col gap-1.5"><label for="decision-note" class="text-sm font-medium">Anything Culminate should know about next steps? <span class="font-normal text-muted-foreground">(optional)</span></label>
        <textarea id="decision-note" rows="3" maxlength="280" class="${INPUT} resize-none" placeholder="e.g. I'd like ${esc(cand)} to meet our plant leads next week.">${esc(d.note)}</textarea></div>`;
    } else if (d.choice === "no") {
      follow = `<fieldset class="${cx(state.decisionErr && "rounded-lg outline-2 outline-offset-4 outline-red-500")}"><legend class="mb-2 text-sm font-medium">What didn’t fit?</legend>
          <div class="flex flex-wrap gap-2">${PASS_REASONS.map((r) => { const on = d.reason === r; return `<button type="button" data-action="decision-reason" data-value="${esc(r)}" aria-pressed="${on}" class="${cx("flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-foreground/30 hover:bg-secondary")}">${on ? icon("check", "size-3.5") : ""}${esc(r)}</button>`; }).join("")}</div>
          ${state.decisionErr ? `<p class="mt-2 text-sm" role="alert" style="color:var(--csg-coral-deep)">Pick a reason so Culminate can choose your next introduction well.</p>` : ""}</fieldset>
        <div class="flex flex-col gap-1.5"><label for="decision-note" class="text-sm font-medium">Anything else? <span class="font-normal text-muted-foreground">(optional, only Culminate sees this)</span></label>
          <textarea id="decision-note" rows="2" maxlength="280" class="${INPUT} resize-none">${esc(d.note)}</textarea></div>`;
    }
    return `<div>
      ${pageHeading({ eyebrow: "Step 6 · Your decision", title: `Would you like to move forward with ${esc(cand)}?`, description: `Your answer goes to Culminate first. ${cand} hears from Culminate, in person and with care.` })}
      <div class="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-10">
        <section class="flex flex-col gap-6 rounded-2xl border bg-card p-8">
          <div class="grid grid-cols-2 gap-4">
            ${option("yes", "circle-check", "Yes, let’s keep going", `Culminate shares next steps with you and ${cand}.`)}
            ${option("no", "x", "No, not this time", "Culminate uses your reason to choose your next introduction.")}
          </div>
          ${follow}
          <div class="flex items-center justify-between border-t pt-6">
            <p class="text-sm text-muted-foreground">${d.choice ? "You can’t undo this once it’s sent." : "Choose yes or no to continue."}</p>
            ${button({ size: "lg", className: "csg-cta h-11 gap-2 rounded-full px-5", attrs: `data-action="decision-send"${d.choice ? "" : " disabled"}`, content: icon("send", "size-4") + "Send my answer" })}
          </div>
        </section>
        <div>${profileCard(MATCH, { label: "Your candidate", highlight: connection(state.card, MATCH).highlight })}</div>
      </div></div>`;
  }

  function completeScreen() {
    const c = connection(state.card, MATCH), d = state.decision, cand = firstName(MATCH.name), yes = d.choice !== "no";
    return `<div>
      <div class="mb-10 flex flex-col items-center text-center">
        <p class="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${icon("party-popper", "size-4")}Introduction complete</p>
        <h1 class="max-w-3xl font-serif text-6xl leading-[1.05] text-balance">${yes ? `You said yes to ${esc(cand)}.` : "Thanks for your answer."}</h1>
        <p class="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">${yes
          ? `Culminate will share next steps with you and ${esc(cand)}. Whatever happens next is between the two of you — Marcus is around if you’d like a sounding board.`
          : `Culminate will let ${esc(cand)} know, kindly and in person, and use what you shared${d.reason ? ` (${esc(d.reason.toLowerCase())})` : ""} to choose your next introduction.`}</p>
        ${goBetween(false, "mt-6")}
      </div>
      ${threeColumns(
        profileCard(state.card, { label: "You", highlight: c.highlight }),
        connectionPanel(c, button({ variant: "outline", className: "w-full gap-2 rounded-full", attrs: 'data-action="restart"', content: icon("rotate-ccw", "size-4") + "Restart prototype" })),
        profileCard(MATCH, { label: "Your candidate", highlight: c.highlight })
      )}</div>`;
  }

  function screen() {
    if (!state.account.signedIn) return accountScreen();
    switch (state.step) {
      case "welcome": return state.optedOut ? optedOutScreen() : welcomeScreen();
      case "build": return buildScreen();
      case "role": return roleScreen();
      case "match": return matchScreen();
      case "brief": return briefScreen();
      case "interview": return interviewScreen();
      case "decision": return decisionScreen();
      case "complete": return completeScreen();
    }
  }

  function callControl(action, active, label, iconHtml) {
    return `<button type="button" data-action="${action}" aria-label="${label}" title="${label}" class="${cx("flex size-12 items-center justify-center rounded-full transition-colors", active ? "bg-white/10 hover:bg-white/20" : "bg-white text-foreground hover:bg-white/90")}">${iconHtml}</button>`;
  }
  function videoCall(cfg) {
    const c = state.call;
    return `<section aria-label="${esc(cfg.callTitle)}" class="${cx("flex flex-col overflow-hidden rounded-2xl border bg-foreground text-background shadow-xl", anim("animate-in fade-in zoom-in-95 duration-500"))}">
      <div class="flex items-center justify-between px-5 py-3 text-sm">
        <div class="flex items-center gap-2"><span class="flex size-2 rounded-full bg-red-500" aria-hidden="true"></span><span class="font-medium">${esc(cfg.callTitle)}</span></div>
        <span id="call-time" class="tabular-nums text-background/70">${fmt(c.seconds)}</span>
      </div>
      <div class="relative aspect-video overflow-hidden bg-black">
        <img src="${esc(cfg.remote.photo)}" alt="Video feed of ${esc(cfg.remote.name)}" class="size-full object-cover" data-fallback="Video unavailable. Try leaving and rejoining the call.">
        <div class="absolute bottom-4 left-4 rounded-lg bg-black/55 px-3 py-1.5 backdrop-blur"><p class="text-sm font-medium">${esc(cfg.remote.name)}</p><p class="text-xs text-white/70">${esc(cfg.remote.title)}</p></div>
        ${c.captions ? `<p class="absolute inset-x-0 bottom-20 mx-auto w-fit max-w-[70%] rounded-md bg-black/65 px-4 py-2 text-center text-sm leading-relaxed text-white">${esc(cfg.caption)}</p>` : ""}
        <div class="absolute right-4 top-4 h-32 w-48 overflow-hidden rounded-xl border-2 border-white/20 bg-neutral-800 shadow-lg">
          ${c.cam ? avatar(state.card, "size-full text-2xl text-white") : '<div class="flex size-full items-center justify-center text-xs text-white/60">Camera off</div>'}
          <span class="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[11px] text-white">${!c.mic ? icon("mic-off", "size-3") : ""}You</span>
        </div>
      </div>
      <div class="flex items-center justify-center gap-3 px-5 py-4">
        ${callControl("toggle-mic", c.mic, c.mic ? "Mute" : "Unmute", icon(c.mic ? "mic" : "mic-off", "size-5"))}
        ${callControl("toggle-cam", c.cam, c.cam ? "Turn camera off" : "Turn camera on", icon(c.cam ? "video" : "video-off", "size-5"))}
        ${callControl("toggle-captions", c.captions, c.captions ? "Hide captions" : "Show captions", icon("captions", "size-5"))}
        <button type="button" data-action="end-call" data-next="${cfg.next}" class="ml-4 flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700">${icon("phone-off", "size-4")}End call</button>
      </div>
    </section>`;
  }
  /* ---------- Booking calendar (step 5) ---------- */
  // Prototype availability: weekdays from tomorrow for 5 weeks, with a few days and times taken.
  // A real build would read the psychologist's and hiring manager's calendars.
  const SLOT_TIMES = ["9:00 AM", "10:30 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:30 PM", "4:30 PM"];
  const LENGTH = { interview: "45 minutes" };
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const prettyDay = (s) => fromYmd(s).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const shortDay = (s) => fromYmd(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  function bookingWindow(kind) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let start = new Date(today); start.setDate(start.getDate() + 1);
    const end = new Date(start); end.setDate(end.getDate() + 35);
    return { start, end };
  }
  function slotsFor(kind, dateStr) {
    const d = fromYmd(dateStr), { start, end } = bookingWindow(kind);
    if (d < start || d > end || d.getDay() === 0 || d.getDay() === 6) return [];
    const seed = d.getDate() * 7 + d.getMonth() * 3 + (kind === "psychologist" ? 0 : 2);
    if (seed % 6 === 0) return []; // fully booked that day
    return SLOT_TIMES.filter((_, i) => (seed + i) % 3 !== 0);
  }
  // The booked call's start as a Date (times are Central; the prototype treats them as local time)
  function bookedStart(kind) {
    const b = state.booking[kind];
    const [, h, m, ap] = b.time.match(/(\d+):(\d+) (AM|PM)/);
    const d = fromYmd(b.date);
    d.setHours((Number(h) % 12) + (ap === "PM" ? 12 : 0), Number(m), 0, 0);
    return d;
  }
  // "Join video call" stays greyed out until the booked time (or the prototype's "Skip to time")
  const callIsOpen = (kind) => {
    const b = state.booking[kind];
    if (b.skipped) return true;
    try { return Date.now() >= bookedStart(kind).getTime(); } catch (e) { return false; }
  };

  function bookingCalendar(kind, cfg) {
    const b = state.booking[kind], { start } = bookingWindow(kind);
    const month = b.month ? fromYmd(b.month) : new Date(start.getFullYear(), start.getMonth(), 1);
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first grid
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const canPrev = first > startMonth, canNext = first < new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1);
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push('<span class="k-cal-day is-blank"></span>');
    for (let n = 1; n <= days; n++) {
      const ds = ymd(new Date(month.getFullYear(), month.getMonth(), n)), open = slotsFor(kind, ds).length > 0, sel = b.date === ds;
      cells.push(open
        ? `<button type="button" class="${cx("k-cal-day is-open", sel && "is-selected")}" data-action="cal-day" data-kind="${kind}" data-date="${ds}" aria-pressed="${sel}" aria-label="${prettyDay(ds)}">${n}</button>`
        : `<span class="k-cal-day" aria-hidden="true">${n}</span>`);
    }
    const times = b.date ? slotsFor(kind, b.date) : [];
    const who = cfg.remote.name;
    return `<section aria-label="Book your interview" class="${cx("rounded-2xl border bg-card p-8", anim("animate-in fade-in duration-500"))}">
      <p class="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${icon("calendar-check", "size-4")}Book your time</p>
      <h2 class="font-serif text-3xl leading-tight">When works for you?</h2>
      <p class="mt-2 text-base text-muted-foreground">Pick a day and time to meet ${esc(who)}. ${LENGTH[kind]}, by video in Katalyzr. Marcus will join to open the call.</p>
      <div class="k-cal mt-6">
        <div>
          <div class="k-cal-head">
            <button type="button" class="k-cal-nav" data-action="cal-month" data-kind="${kind}" data-dir="-1"${canPrev ? "" : " disabled"} aria-label="Previous month">${icon("chevron-left", "size-4")}</button>
            <p class="font-serif text-lg">${month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            <button type="button" class="k-cal-nav" data-action="cal-month" data-kind="${kind}" data-dir="1"${canNext ? "" : " disabled"} aria-label="Next month">${icon("chevron-right", "size-4")}</button>
          </div>
          <div class="k-cal-grid">${["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => `<span class="k-cal-dow">${d}</span>`).join("")}${cells.join("")}</div>
          <p class="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><span class="k-cal-key"></span>Available</p>
        </div>
        <div class="k-cal-times">
          ${b.date
            ? `<p class="mb-3 text-sm font-medium">${esc(prettyDay(b.date))}</p>
               <div class="flex flex-col gap-2">${times.map((t) => `<button type="button" class="${cx("k-cal-time", b.time === t && "is-selected")}" data-action="cal-time" data-kind="${kind}" data-time="${t}" aria-pressed="${b.time === t}">${t}</button>`).join("")}</div>`
            : `<div class="k-cal-empty">${icon("calendar-check", "size-6")}<p>Choose a day to see open times.</p></div>`}
        </div>
      </div>
      <div class="mt-6 flex items-center justify-between border-t pt-6">
        <p class="flex items-center gap-2 text-xs text-muted-foreground">${icon("clock", "size-3.5")}Times shown in Central Time (CT)</p>
        ${button({ size: "lg", className: "csg-cta h-11 gap-2 rounded-full px-5", attrs: `data-action="cal-confirm" data-kind="${kind}"${b.date && b.time ? "" : " disabled"}`, content: icon("check", "size-4") + (b.date && b.time ? `Book ${esc(shortDay(b.date))} at ${b.time}` : "Pick a day and time") })}
      </div>
    </section>`;
  }

  /* ---------- Error handling ---------- */
  // Read an uploaded photo as a small JPEG data URL, so it's saved with the card and survives a refresh
  function readPhoto(file, done) {
    const fail = () => { state.photoError = "That photo couldn’t be read. Try a JPG or PNG image."; render(); };
    if (!file || !/^image\//.test(file.type)) return fail();
    const reader = new FileReader();
    reader.onerror = fail;
    reader.onload = () => {
      const img = new Image();
      img.onerror = fail;
      img.onload = () => {
        try {
          const scale = Math.min(1, 640 / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          state.photoError = "";
          done(c.toDataURL("image/jpeg", 0.85));
        } catch (e) { fail(); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  // Draw one part of a page; if it throws, show a small "couldn't load" box instead of breaking the page
  function safe(label, draw) {
    try { return draw(); }
    catch (err) {
      console.error(`Katalyzr: ${label} failed to load`, err);
      return `<div class="k-error-box" role="alert">${icon("circle-help", "size-5")}<div><p class="font-medium">The ${esc(label)} couldn’t load.</p><p class="text-sm text-muted-foreground">Your progress is saved. Try again, or keep going with the rest of the page.</p></div><button type="button" data-action="retry" class="k-error-retry">Try again</button></div>`;
    }
  }
  // Whole-page fallback if a step can't be drawn at all
  function errorScreen() {
    const prev = STEPS[STEPS.indexOf(state.step) - 1];
    return `<div class="flex min-h-screen min-w-[1200px] flex-col">
      <header class="csg-header border-b"><div class="mx-auto flex max-w-7xl items-center px-8 py-4"><div class="flex items-center gap-3">${CSG_MARK}<span class="font-serif text-2xl tracking-tight">Katalyzr</span></div></div></header>
      <main class="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center py-16 text-center">
        ${iconTile("circle-help", "size-16")}
        <h1 class="mt-6 font-serif text-4xl leading-tight">Something went wrong on this step.</h1>
        <p class="mt-3 text-base text-muted-foreground">Don’t worry, your card and progress are saved. Try loading the step again, or go back one step.</p>
        <div class="mt-8 flex items-center gap-3">
          ${button({ size: "lg", className: "csg-cta h-11 rounded-full px-5", attrs: 'data-action="retry"', content: "Try again" })}
          ${prev ? button({ variant: "outline", className: "h-11 rounded-full px-5", attrs: `data-action="goto" data-step="${prev}"`, content: "Go back a step" }) : ""}
          <button type="button" data-action="restart" class="text-sm text-muted-foreground underline decoration-dotted underline-offset-4">Start over</button>
        </div>
      </main></div>`;
  }
  // If any image fails to load (missing file, bad link, expired upload), swap in a placeholder
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !root.contains(img)) return;
    const box = document.createElement("div");
    box.className = img.className + " k-img-fallback";
    box.textContent = img.dataset.fallback || "";
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", img.alt || "Image unavailable");
    img.replaceWith(box);
  }, true);

  /* ---------- Render (keeps focus and cursor position across re-renders) ---------- */
  const root = document.getElementById("root");
  function render(withAnimation = false) {
    const active = document.activeElement;
    const focusId = active && active.id;
    let selStart = null, selEnd = null;
    try { selStart = active.selectionStart; selEnd = active.selectionEnd; } catch (e) { /* not a text field */ }
    animate = withAnimation;
    try { root.innerHTML = shell(screen()) + modal(); }
    catch (err) { console.error("Katalyzr: this step couldn’t be drawn", err); root.innerHTML = errorScreen(); }
    animate = false;
    saveProgress();
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el && !el.disabled) {
        el.focus({ preventScroll: true });
        try { if (selStart !== null) el.setSelectionRange(selStart, selEnd); } catch (e) { /* number inputs */ }
      }
    }
  }

  /* ---------- Timers ---------- */
  function startCallTimer() {
    timers.push(setInterval(() => {
      state.call.seconds++;
      const el = document.getElementById("call-time");
      if (el) { el.textContent = fmt(state.call.seconds); el.setAttribute("aria-label", `Call duration ${fmt(state.call.seconds)}`); }
    }, 1000));
  }

  /* ---------- Episode draft ---------- */
  // Prototype: a real build would draft the card from the episode transcript. Here it fills Elena's details.
  function importEpisodeDraft() {
    const patch = {};
    EPISODE_DRAFT.forEach((k) => { patch[k] = Array.isArray(SAMPLE_CARD[k]) ? [...SAMPLE_CARD[k]] : SAMPLE_CARD[k]; });
    state.card = cleanCard({ ...state.card, ...patch });
    state.draft.imported = true;
    state.showErrors = false;
    render();
  }

  /* ---------- Events ---------- */
  function addChip(key) {
    const g = chipGroups()[key], v = (state.chipDrafts[key] || "").trim();
    if (!v || g.selected.length >= g.max || g.selected.some((s) => s.toLowerCase() === v.toLowerCase())) return;
    state.chipDrafts[key] = "";
    g.set([...g.selected, v]);
  }
  root.addEventListener("click", (e) => {
    try { handleClick(e); } catch (err) { console.error("Katalyzr: that action failed", err); root.innerHTML = errorScreen(); }
  });
  function handleClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const { action } = el.dataset;
    const c = state.call;
    switch (action) {
      case "goto": return goTo(el.dataset.step);
      case "restart": return restart();
      case "retry": return render();
      case "acc-show": state.account.show = !state.account.show; return render();
      case "acc-fill": state.account = { ...state.account, username: DEMO_LOGIN.username, password: DEMO_LOGIN.password, errors: {} }; return render();
      case "modal": {
        state.modal = el.dataset.modal; state.passErr = false; render();
        const m = document.querySelector(".k-modal textarea, .k-modal input") || document.querySelector(".k-modal button");
        if (m) m.focus();
        return;
      }
      case "close-modal": state.modal = null; return render();
      case "confirm-optout": state.optedOut = true; state.modal = null; render(true); return window.scrollTo({ top: 0, behavior: "smooth" });
      case "undo-optout": state.optedOut = false; state.optOutReason = ""; return render(true);
      case "fill-sample": state.card = cleanCard(SAMPLE_CARD); state.showErrors = false; return render();
      case "draft-import": return importEpisodeDraft();
      case "draft-dismiss": state.draft.imported = false; return render();
      case "sample-photo": state.photoError = ""; return updateCard({ photo: SAMPLE_CARD.photo });
      case "chip": {
        const g = chipGroups()[el.dataset.key], v = el.dataset.value;
        if (g.selected.includes(v)) g.set(g.selected.filter((s) => s !== v));
        else if (g.selected.length < g.max) g.set([...g.selected, v]);
        return;
      }
      case "chip-add": return addChip(el.dataset.key);
      case "arrangement": return updateRole({ arrangement: state.role.arrangement === el.dataset.value ? "" : el.dataset.value });
      case "role-sample": state.role = cleanRole(SAMPLE_ROLE); state.roleErrors = false; return render();
      case "flip": {
        if (state.flipped) return;
        state.flipped = true;
        const card = el.closest(".flip-card");
        if (card) card.classList.add("is-flipped"); // animate the flip first,
        return setTimeout(() => { if (state.step === "match") render(); }, 800); // then show the details
      }
      // Prototype: the candidate accepts the introduction straight away
      case "request-send": state.intro.requested = true; state.modal = null; return render();
      case "pass-confirm":
        if (!state.passed.reason) { state.passErr = true; return render(); }
        state.passed.done = true; state.modal = null; render(true); return window.scrollTo({ top: 0, behavior: "smooth" });
      case "pass-undo": state.passed = { done: false, reason: "", note: "" }; return render(true);
      case "brief-read": state.briefRead = true; return goTo("interview");
      case "join": c.joined = true; render(true); return startCallTimer();
      case "cal-month": {
        const b = state.booking[el.dataset.kind], { start } = bookingWindow(el.dataset.kind);
        const cur = b.month ? fromYmd(b.month) : new Date(start.getFullYear(), start.getMonth(), 1);
        b.month = ymd(new Date(cur.getFullYear(), cur.getMonth() + Number(el.dataset.dir), 1));
        return render();
      }
      case "cal-day": { const b = state.booking[el.dataset.kind]; b.date = el.dataset.date; b.time = null; return render(); }
      case "cal-time": state.booking[el.dataset.kind].time = el.dataset.time; return render();
      case "cal-confirm": { const b = state.booking[el.dataset.kind]; if (b.date && b.time) { b.confirmed = true; render(true); window.scrollTo({ top: 0, behavior: "smooth" }); } return; }
      case "cal-reschedule": { const b = state.booking[el.dataset.kind]; b.confirmed = false; b.skipped = false; return render(); }
      case "cal-skip": state.booking[el.dataset.kind].skipped = true; return render();
      case "end-call": return goTo("decision");
      case "toggle-mic": c.mic = !c.mic; return render();
      case "toggle-cam": c.cam = !c.cam; return render();
      case "toggle-captions": c.captions = !c.captions; return render();
      case "decide": state.decision.choice = el.dataset.value; state.decisionErr = false; return render();
      case "decision-reason": state.decision.reason = state.decision.reason === el.dataset.value ? "" : el.dataset.value; state.decisionErr = false; return render();
      case "decision-send": {
        const d = state.decision;
        if (!d.choice) return;
        if (d.choice === "no" && !d.reason) { state.decisionErr = true; return render(); }
        if (d.choice === "yes") d.reason = "";
        d.sent = true;
        return goTo("complete");
      }
    }
  }
  root.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.field) return updateCard({ [t.dataset.field]: t.value });
    if (t.dataset.roleField) return updateRole({ [t.dataset.roleField]: t.value });
    if (t.dataset.acc) { state.account[t.dataset.acc] = t.value; state.account.errors = {}; return render(); }
    if (t.dataset.chipInput) { state.chipDrafts[t.dataset.chipInput] = t.value; return render(); }
    if (t.id === "intro-note") { state.intro.note = t.value; return; }
    if (t.id === "pass-note") { state.passed.note = t.value; return; }
    if (t.id === "decision-note") { state.decision.note = t.value; return; }
  });
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "step-select") {
      if (t.value === "account") { state.account = freshAccount(); return render(true); }
      if (!state.account.signedIn) state.account.signedIn = true; // prototype: jumping ahead from the dropdown skips sign-in
      return goTo(t.value);
    }
    if (t.name === "optout-reason") { state.optOutReason = t.value; return; }
    if (t.name === "pass-reason") { state.passed.reason = t.value; state.passErr = false; return; }
    if (t.id === "f-photo" && t.files && t.files[0]) return readPhoto(t.files[0], (url) => updateCard({ photo: url }));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.modal) { state.modal = null; render(); }
  });
  root.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.chipInput && e.key === "Enter" && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); addChip(t.dataset.chipInput); }
  });
  root.addEventListener("submit", (e) => {
    const id = e.target.id;
    if (id === "account-form") { e.preventDefault(); return submitAccount(); }
    if (id === "build-form") {
      e.preventDefault();
      if (checklist(state.card).every((x) => x.done)) goTo("role"); else { state.showErrors = true; render(); }
    }
    if (id === "role-form") {
      e.preventDefault();
      if (roleChecklist(state.role).every((x) => x.done)) goTo("match"); else { state.roleErrors = true; render(); }
    }
  });

  // When the booked time arrives while someone is on the page, unlock "Join video call"
  setInterval(() => {
    const b = state.booking.interview;
    if (state.step === "interview" && !state.call.joined && !state.modal && b.confirmed && !b.skipped) {
      const btn = document.querySelector('[data-action="join"]');
      if (btn && btn.disabled && callIsOpen("interview")) render();
    }
  }, 30000);

  // Start-up: ?restart=1 starts fresh; otherwise pick up where you left off.
  try {
    const params = new URLSearchParams(location.search);
    if (params.get("restart") === "1") {
      clearProgress();
      params.delete("restart");
      history.replaceState(null, "", location.pathname + (params.toString() ? "?" + params : "") + location.hash);
    } else {
      loadProgress();
      if (takeHandoff()) { /* arrived signed in from the applicant prototype's sign-in page */ }
    }
  } catch (e) { /* bad URL or storage unavailable: start fresh */ }
  window.addEventListener("pagehide", saveProgress);

  render(true);
})();
