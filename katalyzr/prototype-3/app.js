/* Katalyzr prototype — plain-JavaScript port of the v0/Next.js version at katalyzr.vercel.app.
   Same markup and Tailwind classes, so it uses the original compiled stylesheet (styles.css). */
(function () {
  "use strict";

  /* ---------- Data ---------- */
  const STEPS = ["welcome", "build", "waiting", "match", "episode", "psychologist", "hiring-manager", "complete"];
  const STEP_LABELS = {
    welcome: "Welcome",
    build: "Build your card",
    waiting: "Waiting for your match",
    match: "Match reveal",
    episode: "Listen to the introduction",
    psychologist: "Psychologist interview",
    "hiring-manager": "Hiring manager interview",
    complete: "Introduction complete",
  };
  const PROGRESS = ["Invited", "Card complete", "Matched", "Episode listened", "Psychologist interview", "Hiring manager interview"];
  const PROGRESS_STEPS = ["welcome", "build", "match", "episode", "psychologist", "hiring-manager"];

  const EMPTY_APPLICANT = { photo: null, name: "", role: "", skills: [], experienceYears: "", experience: "", values: [], workingStyle: [], personality: [], mindset: "" };
  const SAMPLE_APPLICANT = {
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
  const MATCH = {
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
  const PSYCH = { name: "Dr. Marcus Hale", title: "Talent Psychologist, CSG", photo: "images/psychologist.jpg" };
  const PODCAST = "Uncommon Operator";
  const EPISODE_LENGTH = 3494;
  const CHAPTERS = [
    { start: 0, label: "Cold open" },
    { start: 142, label: "From factory floor to COO" },
    { start: 860, label: "Why calm is a competitive advantage" },
    { start: 1720, label: "Hiring for mindset over résumé" },
    { start: 2640, label: "A written-decision culture" },
    { start: 3180, label: "What she looks for in a partner" },
  ];
  const TECH_SKILLS = ["Systems thinking", "Operations", "Product strategy", "Go-to-market", "Data analysis", "Fundraising", "Engineering leadership", "Brand"];
  const PERSONAL_SKILLS = ["Team building", "Negotiation"];
  const VALUES = ["Candor", "Ownership", "Curiosity", "Craft", "Long-term thinking", "Generosity", "Speed", "Humility"];
  const WORKING_STYLES = ["Async-first", "Written decisions", "Deep work blocks", "High autonomy", "Highly collaborative", "In-person energy"];
  const PERSONALITIES = ["Direct", "Warm", "Calm under pressure", "Curious", "Playful", "Restless", "Reflective"];
  const WAITING_MESSAGES = [
    "Reading your card closely…",
    "Reviewing a short list of CSG hiring managers…",
    "Comparing values and working style…",
    "Checking for a genuine mindset fit…",
    "Found someone you should meet.",
  ];
  const HOW_IT_WORKS = [
    { title: "Build your card", body: "Tell us how you think and work. Not a résumé.", icon: "id-card" },
    { title: "Meet your match", body: "One hiring manager, chosen by hand for shared mindset.", icon: "hiring-manager" },
    { title: "Two conversations", body: "A psychologist, then the hiring manager. That’s the whole process.", icon: "messages-square" },
  ];
  const firstName = (n) => n.split(" ")[0];
  const INTERVIEWS = {
    psychologist: {
      eyebrow: "Step 5 · First conversation",
      title: `A conversation with ${PSYCH.name}.`,
      description: "Not a test. Marcus will ask what stayed with you from the episode and how you like to work. About 30 minutes.",
      callTitle: "Katalyzr · Psychologist interview",
      remote: { name: PSYCH.name, title: PSYCH.title, photo: PSYCH.photo },
      caption: "“So — what was the first thing you thought when Elena talked about calm being a competitive advantage?”",
      agenda: ["What stayed with you from the episode", "How you make decisions under pressure", "What you need from a partner"],
      next: "hiring-manager",
    },
    "hiring-manager": {
      eyebrow: "Step 6 · The introduction",
      title: `Now, meet ${firstName(MATCH.name)}.`,
      description: "Marcus will open the call and introduce you both, then step back. One conversation, two people who already share a lot.",
      callTitle: `Katalyzr · Introduction with ${MATCH.name}`,
      remote: { name: MATCH.name, title: `${MATCH.role}, ${MATCH.company}`, photo: "images/hiring-manager-call.jpg" },
      caption: "“Marcus told me you write everything down too. I think we’re going to get along.”",
      agenda: ["A brief introduction from Marcus", "Elena on what she’s building next", "Open conversation"],
      next: "complete",
    },
  };

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
      { label: "Personality", done: a.personality.length >= 1 },
      { label: "Mindset", done: !!a.mindset.trim() },
    ];
  }
  function fmt(sec) {
    const t = Math.max(0, Math.floor(sec)), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = String(t % 60).padStart(2, "0");
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
  }

  /* ---------- State ---------- */
  const state = {
    step: "welcome",
    applicant: { ...EMPTY_APPLICANT },
    episodeListened: false,
    showErrors: false,
    chipDrafts: {},
    waitIndex: 0,
    player: { time: 0, playing: false, speed: 1, chaptersOpen: false },
    call: { joined: false, seconds: 0, mic: true, cam: true, captions: true },
  };
  let timers = [];
  const clearTimers = () => { timers.forEach((t) => clearInterval(t)); timers = []; };

  function goTo(step) {
    const idx = STEPS.indexOf(step);
    if (idx > STEPS.indexOf("build") && !checklist(state.applicant).every((c) => c.done)) {
      const filled = Object.fromEntries(Object.entries(state.applicant).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : !!v)));
      state.applicant = { ...SAMPLE_APPLICANT, ...filled };
    }
    state.episodeListened = idx > STEPS.indexOf("episode");
    state.step = step;
    state.showErrors = false;
    state.chipDrafts = {};
    state.waitIndex = 0;
    state.player = { time: 0, playing: false, speed: 1, chaptersOpen: false };
    state.call = { joined: false, seconds: 0, mic: true, cam: true, captions: true };
    clearTimers();
    render(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    startStepTimers();
  }
  function updateApplicant(patch) { state.applicant = { ...state.applicant, ...patch }; render(); }
  function restart() { state.applicant = { ...EMPTY_APPLICANT }; goTo("welcome"); }

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
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    // Custom: hiring manager — a person holding a clipboard (drawn in the Lucide style)
    "hiring-manager": '<circle cx="8" cy="6" r="3.5"/><path d="M2 21v-1.5A5.5 5.5 0 0 1 7.5 14H11"/><rect x="13" y="11" width="8" height="10.5" rx="1.5"/><path d="M15.5 10.5h3"/><path d="M15.5 15h3"/><path d="M15.5 18h3"/>',
    "id-card": '<path d="M13 19a4 4 0 0 0-8 0"/><path d="M16 10h2"/><path d="M16 14h2"/><circle cx="9" cy="12" r="3"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
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
  const STEP_ICONS = { build: "id-card", waiting: "search", match: "handshake", episode: "headphones", psychologist: "brain", "hiring-manager": "hiring-manager", complete: "party-popper" };
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
      p.photo ? `<img src="${esc(p.photo)}" alt="" class="size-full object-cover">`
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
        ${p.photo ? `<img src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}" class="size-full object-cover">`
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
      <div class="text-left"><p class="text-sm font-medium leading-tight">${esc(PSYCH.name)}</p><p class="text-xs text-muted-foreground">Your go-between · CSG</p></div>
    </div>`;
  }

  /* ---------- Layout ---------- */
  function progressStage() {
    switch (state.step) {
      case "welcome": case "build": return 1;
      case "waiting": return 2;
      case "match": return 3;
      case "episode": return state.episodeListened ? 4 : 3;
      case "psychologist": return 4;
      case "hiring-manager": return 5;
      case "complete": return 6;
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
    const prev = STEPS[STEPS.indexOf(state.step) - 1];
    return `<div class="flex min-h-screen min-w-[1200px] flex-col">
      <header class="csg-header border-b"><div class="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <div class="flex items-center gap-3">${CSG_MARK}<span class="font-serif text-2xl tracking-tight">Katalyzr</span><span class="text-xs text-muted-foreground">by Culminate Strategy Group</span></div>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">${icon("lock", "size-3")}Private invitation · KTZ-0417</span>
          <label class="flex items-center gap-2 text-xs text-muted-foreground"><span>Prototype</span>
            <select id="step-select" class="rounded-md border bg-card px-2 py-1 text-xs text-foreground">${
              STEPS.map((s, i) => `<option value="${s}"${s === state.step ? " selected" : ""}>${i + 1}. ${esc(STEP_LABELS[s])}</option>`).join("")
            }</select></label>
        </div></div></header>
      <main class="flex flex-1 flex-col"><div class="${cx("mx-auto w-full max-w-7xl flex-1 px-8 py-10", anim("animate-in fade-in duration-500"))}">
        ${prev ? `<button type="button" data-action="goto" data-step="${prev}" class="group mb-6 inline-flex items-center gap-2 rounded-full border-2 border-primary/50 bg-card px-4 py-2 text-sm font-medium text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">${icon("arrow-left", "size-4 transition-transform group-hover:-translate-x-0.5")}Back to ${esc(STEP_LABELS[prev])}</button>` : ""}
        ${content}
      </div></main>
      <div class="sticky bottom-0 z-10">${progressNav()}</div>
    </div>`;
  }

  /* ---------- Screens ---------- */
  function welcomeScreen() {
    return `<div class="grid grid-cols-[1.1fr_1fr] items-center gap-16 py-6">
      <section aria-labelledby="welcome-heading">
        <p class="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${icon("mail-open", "size-4")}A personal invitation</p>
        <h1 id="welcome-heading" class="font-serif text-7xl leading-[1] text-balance">Jordan, someone wants to <em class="text-primary">meet you</em>.</h1>
        <div class="mt-8 max-w-xl space-y-4 text-lg leading-relaxed text-pretty">
          <p>We came across your work on LinkedIn and kept coming back to it. Katalyzr is invite-only: we introduce a very small number of people to hiring managers who share how they see the world.</p>
          <p class="text-muted-foreground">There are no application forms and no interview gauntlet. Just two conversations.</p>
        </div>
        <div class="mt-8 flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-full bg-primary font-serif text-lg text-primary-foreground">PN</div>
          <div><p class="font-serif text-xl italic leading-tight">Priya Natarajan</p><p class="text-xs text-muted-foreground">Partner, Culminate Strategy Group</p></div>
        </div>
        ${button({ size: "lg", className: "csg-cta mt-10 h-12 gap-2 rounded-full px-6 text-base", attrs: 'data-action="goto" data-step="build"', content: "Accept invitation" + icon("arrow-right", "size-4") })}
      </section>
      <aside aria-label="How it works" class="flex flex-col gap-8">
        <div class="relative mx-auto h-72 w-full max-w-md" aria-hidden="true">
          <div class="absolute left-6 top-6 h-64 w-48 -rotate-6 rounded-2xl border bg-card p-4 shadow-lg">
            <div class="h-28 rounded-lg bg-muted"></div><p class="mt-3 font-serif text-xl">You</p>
            <div class="mt-2 flex gap-1.5"><span class="h-4 w-12 rounded-full bg-secondary"></span><span class="h-4 w-16 rounded-full bg-accent"></span></div>
          </div>
          <div class="absolute right-6 top-0 h-64 w-48 rotate-6 rounded-2xl border border-dashed border-brass bg-card/60 p-4 shadow-lg">
            <div class="h-28 rounded-lg bg-accent/50"></div><p class="mt-3 font-serif text-xl text-muted-foreground">Your match</p>
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
  // Chip-group definitions: how each picker reads and writes the applicant.
  function chipGroups() {
    const a = state.applicant;
    const custom = a.customPersonalSkills || [];
    const isPersonal = (s) => PERSONAL_SKILLS.includes(s) || custom.includes(s);
    const personal = a.skills.filter(isPersonal), tech = a.skills.filter((s) => !isPersonal(s));
    return {
      tech: { label: "Technical skills", hint: "up to 3", options: TECH_SKILLS, selected: tech, max: 3, invalid: a.skills.length < 2, set: (v) => updateApplicant({ skills: [...v, ...personal] }) },
      personal: { label: "Personal skills", hint: "up to 3", options: PERSONAL_SKILLS, selected: personal, max: 3, invalid: a.skills.length < 2, set: (v) => updateApplicant({ skills: [...tech, ...v], customPersonalSkills: v.filter((s) => !PERSONAL_SKILLS.includes(s)) }) },
      values: { label: "Values", hint: "pick at least 2", options: VALUES, selected: a.values, max: 4, invalid: a.values.length < 2, set: (v) => updateApplicant({ values: v }) },
      workingStyle: { label: "Working style", hint: "up to 3", options: WORKING_STYLES, selected: a.workingStyle, max: 3, invalid: a.workingStyle.length === 0, set: (v) => updateApplicant({ workingStyle: v }) },
      personality: { label: "Personality", hint: "up to 3", options: PERSONALITIES, selected: a.personality, max: 3, invalid: a.personality.length === 0, set: (v) => updateApplicant({ personality: v }) },
    };
  }
  function buildScreen() {
    const a = state.applicant, list = checklist(a), done = list.filter((c) => c.done).length, ready = done === list.length;
    const err = (bad) => state.showErrors && bad;
    const groups = chipGroups();
    const picker = (key) => chipPicker({ key, ...groups[key], invalid: err(groups[key].invalid) });
    const field = (label, id, input) => `<div class="flex flex-col gap-1.5"><label for="${id}" class="text-sm font-medium">${esc(label)}</label>${input}</div>`;
    const section = (title, body, ic) => `<section class="flex flex-col gap-5"><h2 class="flex items-center gap-3 font-serif text-2xl">${iconTile(ic)}${esc(title)}</h2>${body}</section>`;
    return `<div>
      <div class="flex items-end justify-between">
        ${pageHeading({ eyebrow: "Step 1 · Build your card", title: "This is how you’ll be introduced.", description: "Your card is what your match sees first. Keep it honest and specific — it updates as you type." })}
        ${button({ variant: "outline", className: "mb-8 gap-2 rounded-full", attrs: 'data-action="fill-sample"', content: icon("sparkles", "size-4") + "Fill with sample" })}
      </div>
      <div class="grid grid-cols-[360px_minmax(0,1fr)] items-start gap-10">
        <div class="sticky top-6 flex flex-col gap-4">
          ${profileCard(a, { label: "You · Live preview", editing: true })}
          <div class="rounded-xl border bg-card/70 p-4">
            <p class="mb-2 text-xs font-medium text-muted-foreground">${done} of ${list.length} complete</p>
            <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5">${list.map((c) => `<li class="${cx("flex items-center gap-1.5 text-xs", c.done ? "text-foreground" : "text-muted-foreground")}">
              <span class="${cx("flex size-4 items-center justify-center rounded-full border", c.done && "border-primary bg-primary text-primary-foreground")}">${c.done ? icon("check", "size-2.5") : ""}</span>${esc(c.label)}</li>`).join("")}</ul>
          </div>
        </div>
        <form id="build-form" class="flex flex-col gap-8 rounded-2xl border bg-card p-8" novalidate>
          ${section("The basics", `
            <div class="${cx("flex items-center gap-4 rounded-lg", err(!a.photo) && "outline-2 outline-offset-4 outline-red-500")}">
              ${avatar(a, "size-16 rounded-full")}
              <div class="flex flex-wrap gap-2">
                <label for="f-photo" class="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-secondary focus-within:ring-3 focus-within:ring-primary/20">${icon("upload", "size-4")}Upload photo<input id="f-photo" type="file" accept="image/*" class="sr-only"></label>
                <button type="button" data-action="sample-photo" class="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Use sample photo</button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              ${field("Full name", "f-name", `<input id="f-name" data-field="name" class="${cx(INPUT, err(!a.name.trim()) && INVALID)}" value="${esc(a.name)}" autocomplete="name">`)}
              ${field("Current role", "f-role", `<input id="f-role" data-field="role" class="${cx(INPUT, err(!a.role.trim()) && INVALID)}" value="${esc(a.role)}" autocomplete="organization-title">`)}
            </div>`, "user-round")}
          ${section("Experience", `
            <div class="grid grid-cols-[120px_minmax(0,1fr)] gap-4">
              ${field("Years", "f-years", `<input id="f-years" data-field="experienceYears" type="number" min="0" max="60" inputmode="numeric" class="${cx(INPUT, err(!a.experienceYears.trim()) && INVALID)}" value="${esc(a.experienceYears)}">`)}
              ${field("In one sentence, what have you built?", "f-exp", `<input id="f-exp" data-field="experience" maxlength="140" class="${cx(INPUT, err(!a.experience.trim()) && INVALID)}" value="${esc(a.experience)}">`)}
            </div>
            ${picker("tech")}${picker("personal")}`, "briefcase-business")}
          ${section("How you work", picker("values") + picker("workingStyle") + picker("personality"), "compass")}
          ${section("Mindset", field("The belief that drives how you work", "f-mindset", `<textarea id="f-mindset" data-field="mindset" rows="2" maxlength="100" class="${cx(INPUT, "resize-none font-serif text-lg italic", err(!a.mindset.trim()) && INVALID)}">${esc(a.mindset)}</textarea>`), "lightbulb")}
          <div class="flex items-center justify-between border-t pt-6">
            <p class="text-sm text-muted-foreground">${ready ? "Your card is ready." : "Complete every section to find your match."}</p>
            <button type="submit" data-slot="button" class="${merge(cx(BTN_BASE, BTN_VARIANT.default, BTN_SIZE.lg, "csg-cta h-11 gap-2 rounded-full px-5"))}">Find my match${icon("arrow-right", "size-4")}</button>
          </div>
        </form>
      </div></div>`;
  }

  function waitingScreen() {
    const last = state.waitIndex === WAITING_MESSAGES.length - 1;
    return `<div>
      ${pageHeading({ eyebrow: "Step 2 · Finding your match", title: "Your card is complete.", description: "The Katalyzr bot is looking for the one hiring manager you should meet. This isn’t a marketplace — you’ll get one introduction." })}
      ${threeColumns(
        profileCard(state.applicant, { label: "You" }),
        `<div class="flex h-full flex-col items-center pt-32">
          <div class="flex w-full items-center gap-2" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<span class="h-1.5 flex-1 rounded-full bg-brass/70 animate-pulse" style="animation-delay:${120 * i}ms"></span>`).join("")}</div>
          ${last ? button({ size: "lg", className: cx("csg-cta mt-10 h-11 gap-2 rounded-full px-5", anim("animate-in fade-in zoom-in-95")), attrs: 'data-action="goto" data-step="match"', content: "Reveal your match" + icon("arrow-right", "size-4") }) : ""}
        </div>`,
        `<div class="flex aspect-[3/5] w-full flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-brass/60 bg-card/50 p-8 text-center">
          <span class="${cx("flex size-16 items-center justify-center rounded-full bg-accent", !last && "animate-pulse")}">${icon("bot", "size-7 text-accent-foreground")}</span>
          <div><p class="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Your match</p><p class="mt-2 font-serif text-2xl leading-tight text-balance">Your match is being found by the Katalyzr bot</p></div>
          <p id="wait-status" role="status" aria-live="polite" class="min-h-10 text-sm text-muted-foreground">${esc(WAITING_MESSAGES[state.waitIndex])}</p>
        </div>`
      )}</div>`;
  }

  function matchScreen() {
    const c = connection(state.applicant, MATCH), first = firstName(MATCH.name);
    return `<div>
      ${pageHeading({ eyebrow: "Step 3 · Your match", title: `Meet <em class="text-primary">${esc(MATCH.name)}</em>.`, description: `${first} runs operations at ${MATCH.company}. Highlighted traits are the ones you share.` })}
      ${threeColumns(
        profileCard(state.applicant, { label: "You", highlight: c.highlight }),
        connectionPanel(c, button({ size: "lg", className: "h-11 w-full gap-2 rounded-full", attrs: 'data-action="goto" data-step="episode"', content: `Listen to ${esc(first)}'s introduction` + icon("arrow-right", "size-4") })),
        profileCard(MATCH, {
          label: "Your match", highlight: c.highlight, className: anim("animate-in fade-in slide-in-from-right-8 duration-700"),
          footer: `<div class="flex items-center gap-3 border-t bg-secondary/50 px-5 py-3">${icon("headphones", "size-4 text-primary")}
            <p class="flex-1 text-xs leading-snug"><span class="font-medium">${PODCAST}</span> episode attached</p>
            <span class="flex items-center gap-1 text-[11px] text-muted-foreground">${icon("lock", "size-3")}Unlocks next</span></div>`,
        })
      )}</div>`;
  }

  function currentChapter(t) { return [...CHAPTERS].reverse().find((c) => t >= c.start) || CHAPTERS[0]; }
  const scrubBg = (pct) => `linear-gradient(to right, var(--brass) ${pct}%, color-mix(in oklch, var(--primary-foreground) 20%, transparent) ${pct}%)`;
  function podcastPlayer() {
    const p = state.player, pct = (p.time / EPISODE_LENGTH) * 100, ch = currentChapter(p.time);
    return `<section id="player" aria-label="${PODCAST} podcast player" class="border-t bg-primary text-primary-foreground">
      <div class="flex gap-3 p-4">
        <img src="images/podcast-cover.jpg" alt="" class="size-16 shrink-0 rounded-md object-cover">
        <div class="min-w-0"><p class="text-[11px] uppercase tracking-[0.14em] text-primary-foreground/70">${PODCAST} · Ep. 47</p>
          <p class="font-serif text-lg leading-snug text-pretty">Elena Vasquez on building calm companies in chaotic markets</p></div>
      </div>
      <div class="px-4">
        <label for="episode-scrubber" class="sr-only">Seek episode</label>
        <input id="episode-scrubber" type="range" min="0" max="${EPISODE_LENGTH}" step="1" value="${p.time}" aria-valuetext="${fmt(p.time)} of ${fmt(EPISODE_LENGTH)}" class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary-foreground/20 accent-brass" style="background:${scrubBg(pct)}">
        <div class="mt-1 flex justify-between text-[11px] tabular-nums text-primary-foreground/70">
          <span id="ep-cur">${fmt(p.time)}</span><span id="ep-chapter" class="truncate px-2">${esc(ch.label)}</span><span id="ep-rem">-${fmt(EPISODE_LENGTH - p.time)}</span>
        </div>
      </div>
      <div class="flex items-center justify-between px-4 py-3">
        <button type="button" data-action="speed" class="w-12 rounded-md border border-primary-foreground/25 py-1 text-xs tabular-nums hover:bg-primary-foreground/10" aria-label="Playback speed ${p.speed}x">${p.speed}x</button>
        <div class="flex items-center gap-3">
          <button type="button" data-action="seek-rel" data-delta="-15" class="rounded-full p-2 hover:bg-primary-foreground/10">${icon("rotate-ccw", "size-5")}<span class="sr-only">Back 15 seconds</span></button>
          <button type="button" data-action="play" class="flex size-12 items-center justify-center rounded-full bg-brass text-foreground transition-transform hover:scale-105">${p.playing ? icon("pause", "size-5 fill-current") : icon("play", "ml-0.5 size-5 fill-current")}<span class="sr-only">${p.playing ? "Pause" : "Play"}</span></button>
          <button type="button" data-action="seek-rel" data-delta="30" class="rounded-full p-2 hover:bg-primary-foreground/10">${icon("rotate-cw", "size-5")}<span class="sr-only">Forward 30 seconds</span></button>
        </div>
        <span class="w-12 text-right text-[11px] tabular-nums text-primary-foreground/70">${fmt(EPISODE_LENGTH)}</span>
      </div>
      <details id="chapters" class="group border-t border-primary-foreground/15"${p.chaptersOpen ? " open" : ""}>
        <summary class="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-xs text-primary-foreground/80 hover:text-primary-foreground">Chapters${icon("chevron-down", "size-4 transition-transform group-open:rotate-180")}</summary>
        <ol class="px-2 pb-2">${CHAPTERS.map((c) => `<li><button type="button" data-action="chapter" data-start="${c.start}" class="${cx("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-primary-foreground/10", c === ch && "bg-primary-foreground/10 text-brass")}"><span>${esc(c.label)}</span><span class="tabular-nums text-primary-foreground/60">${fmt(c.start)}</span></button></li>`).join("")}</ol>
      </details>
      <div class="flex items-center justify-between border-t border-primary-foreground/15 px-4 py-2.5 text-xs">${
        state.episodeListened ? `<span class="flex items-center gap-1.5 text-brass">${icon("check", "size-3.5")}Episode listened</span>`
          : `<span id="ep-pct" class="text-primary-foreground/70">${Math.round(pct)}% listened</span><button type="button" data-action="listened" class="underline underline-offset-2 hover:text-brass">I've listened</button>`
      }</div>
    </section>`;
  }
  // Update the player in place on each tick, so dragging the scrubber isn't interrupted.
  function updatePlayerDom() {
    const p = state.player, pct = (p.time / EPISODE_LENGTH) * 100, ch = currentChapter(p.time);
    const $ = (id) => document.getElementById(id);
    const scrub = $("episode-scrubber");
    if (!scrub) return;
    scrub.value = p.time;
    scrub.style.background = scrubBg(pct);
    scrub.setAttribute("aria-valuetext", `${fmt(p.time)} of ${fmt(EPISODE_LENGTH)}`);
    $("ep-cur").textContent = fmt(p.time);
    $("ep-chapter").textContent = ch.label;
    $("ep-rem").textContent = "-" + fmt(EPISODE_LENGTH - p.time);
    if ($("ep-pct")) $("ep-pct").textContent = Math.round(pct) + "% listened";
    document.querySelectorAll('[data-action="chapter"]').forEach((b) => {
      const on = Number(b.dataset.start) === ch.start;
      b.classList.toggle("bg-primary-foreground/10", on);
      b.classList.toggle("text-brass", on);
    });
  }
  function seek(t) {
    state.player.time = Math.max(0, Math.min(EPISODE_LENGTH, t));
    afterTimeChange();
  }
  function afterTimeChange() {
    const p = state.player;
    let structural = false;
    if (p.time >= EPISODE_LENGTH && p.playing) { p.playing = false; structural = true; }
    if (!state.episodeListened && p.time >= EPISODE_LENGTH * 0.9) { state.episodeListened = true; structural = true; }
    structural ? render() : updatePlayerDom();
  }
  function episodeScreen() {
    const c = connection(state.applicant, MATCH), first = firstName(MATCH.name);
    return `<div>
      ${pageHeading({ eyebrow: "Step 4 · The introduction", title: esc(`Hear ${first} in her own words.`), description: `Instead of a job description, you get an hour of ${first} on ${PODCAST}. You haven’t heard this one before — that’s the point.` })}
      ${threeColumns(
        profileCard(state.applicant, { label: "You", highlight: c.highlight }),
        `<div class="flex h-full flex-col items-center gap-6 pt-10 text-center">
          <span class="flex size-14 items-center justify-center rounded-full bg-accent">${icon("headphones", "size-6 text-accent-foreground")}</span>
          <div class="max-w-xs space-y-3">
            <p class="font-serif text-2xl leading-snug text-balance">Listen for how she thinks, not what she knows.</p>
            <p class="text-sm leading-relaxed text-muted-foreground">About ${Math.round(EPISODE_LENGTH / 60)} minutes. No notes or prep needed — the psychologist will ask what stayed with you.</p>
          </div>
          <div class="w-full max-w-xs rounded-xl border bg-card/70 p-4 text-left">
            <p class="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon("ear", "size-3.5 text-brass")}Listen for what you share</p>
            <ul class="flex flex-wrap gap-1.5">${[...c.values, ...c.personality].map((i) => chip(i, true)).join("")}</ul>
          </div>
          ${button({ size: "lg", className: "h-11 w-full max-w-xs gap-2 rounded-full", attrs: `data-action="goto" data-step="psychologist"${state.episodeListened ? "" : " disabled"}`, content: "Continue to first interview" + icon("arrow-right", "size-4") })}
          ${!state.episodeListened ? `<p class="text-xs text-muted-foreground">Unlocks after listening (${fmt(EPISODE_LENGTH)})</p>` : ""}
        </div>`,
        profileCard(MATCH, { label: "Your match", highlight: c.highlight, footer: podcastPlayer() })
      )}</div>`;
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
        <img src="${esc(cfg.remote.photo)}" alt="Video feed of ${esc(cfg.remote.name)}" class="size-full object-cover">
        <div class="absolute bottom-4 left-4 rounded-lg bg-black/55 px-3 py-1.5 backdrop-blur"><p class="text-sm font-medium">${esc(cfg.remote.name)}</p><p class="text-xs text-white/70">${esc(cfg.remote.title)}</p></div>
        ${c.captions ? `<p class="absolute inset-x-0 bottom-20 mx-auto w-fit max-w-[70%] rounded-md bg-black/65 px-4 py-2 text-center text-sm leading-relaxed text-white">${esc(cfg.caption)}</p>` : ""}
        <div class="absolute right-4 top-4 h-32 w-48 overflow-hidden rounded-xl border-2 border-white/20 bg-neutral-800 shadow-lg">
          ${c.cam ? avatar(state.applicant, "size-full text-2xl text-white") : '<div class="flex size-full items-center justify-center text-xs text-white/60">Camera off</div>'}
          <span class="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[11px] text-white">${!c.mic ? icon("mic-off", "size-3") : ""}You</span>
        </div>
      </div>
      <div class="flex items-center justify-center gap-3 px-5 py-4">
        ${callControl("toggle-mic", c.mic, c.mic ? "Mute" : "Unmute", icon(c.mic ? "mic" : "mic-off", "size-5"))}
        ${callControl("toggle-cam", c.cam, c.cam ? "Turn camera off" : "Turn camera on", icon(c.cam ? "video" : "video-off", "size-5"))}
        ${callControl("toggle-captions", c.captions, c.captions ? "Hide captions" : "Show captions", icon("captions", "size-5"))}
        <button type="button" data-action="goto" data-step="${cfg.next}" class="ml-4 flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700">${icon("phone-off", "size-4")}End call</button>
      </div>
    </section>`;
  }
  function interviewScreen(kind) {
    const cfg = INTERVIEWS[kind], a = state.applicant, hl = connection(a, MATCH).highlight;
    return `<div>
      <div class="flex items-end justify-between">${pageHeading({ eyebrow: cfg.eyebrow, title: esc(cfg.title), description: cfg.description })}${goBetween(state.call.joined, "mb-8")}</div>
      <div class="grid grid-cols-[280px_minmax(0,1fr)] items-start gap-8">
        <aside aria-label="Who's here" class="flex flex-col gap-3">
          ${profileCard(a, { label: "You", variant: "compact" })}
          ${profileCard(MATCH, { label: "Your match", variant: "compact" })}
          <div class="mt-2 rounded-xl border bg-card/70 p-4">
            <p class="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">${icon("list-checks", "size-3.5 text-brass")}What you'll cover</p>
            <ol class="flex flex-col gap-2 text-sm">${cfg.agenda.map((x, i) => `<li class="flex gap-2"><span class="font-serif text-brass">${i + 1}.</span>${esc(x)}</li>`).join("")}</ol>
          </div>
          <p class="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">${icon("sparkles", "size-3.5 text-brass")}${hl.size} shared traits on your cards</p>
        </aside>
        ${state.call.joined ? videoCall(cfg) : `<section aria-label="Join the call" class="flex aspect-video flex-col items-center justify-center gap-6 rounded-2xl border bg-card p-10 text-center">
          <div class="flex items-center -space-x-4">
            ${avatar(a, "size-20 rounded-full border-4 border-card")}${avatar(cfg.remote, "size-20 rounded-full border-4 border-card")}${kind === "hiring-manager" ? avatar(PSYCH, "size-20 rounded-full border-4 border-card") : ""}
          </div>
          <div>
            <p class="flex items-center justify-center gap-2 text-sm text-muted-foreground">${icon("calendar-check", "size-4")}Scheduled for today · 2:00 PM</p>
            <p class="mt-2 font-serif text-3xl">${esc(cfg.remote.name)} is ready when you are.</p>
          </div>
          ${button({ size: "lg", className: "csg-cta h-12 gap-2 rounded-full px-6 text-base", attrs: 'data-action="join"', content: icon("video", "size-4") + "Join video call" })}
        </section>`}
      </div></div>`;
  }

  function completeScreen() {
    const c = connection(state.applicant, MATCH);
    return `<div>
      <div class="mb-10 flex flex-col items-center text-center">
        <p class="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">${icon("party-popper", "size-4")}Introduction complete</p>
        <h1 class="max-w-3xl font-serif text-6xl leading-[1.05] text-balance">That's it. You've been introduced.</h1>
        <p class="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">${esc(firstName(MATCH.name))} and you now have each other's details. Whatever happens next is between the two of you — Marcus is around if you'd like a sounding board.</p>
        ${goBetween(false, "mt-6")}
      </div>
      ${threeColumns(
        profileCard(state.applicant, { label: "You", highlight: c.highlight }),
        connectionPanel(c, button({ variant: "outline", className: "w-full gap-2 rounded-full", attrs: 'data-action="restart"', content: icon("rotate-ccw", "size-4") + "Restart prototype" })),
        profileCard(MATCH, { label: "Your match", highlight: c.highlight })
      )}</div>`;
  }

  function screen() {
    switch (state.step) {
      case "welcome": return welcomeScreen();
      case "build": return buildScreen();
      case "waiting": return waitingScreen();
      case "match": return matchScreen();
      case "episode": return episodeScreen();
      case "psychologist": return interviewScreen("psychologist");
      case "hiring-manager": return interviewScreen("hiring-manager");
      case "complete": return completeScreen();
    }
  }

  /* ---------- Render (keeps focus and cursor position across re-renders) ---------- */
  const root = document.getElementById("root");
  function render(withAnimation = false) {
    const active = document.activeElement;
    const focusId = active && active.id;
    let selStart = null, selEnd = null;
    try { selStart = active.selectionStart; selEnd = active.selectionEnd; } catch (e) { /* not a text field */ }
    animate = withAnimation;
    root.innerHTML = shell(screen());
    animate = false;
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el && !el.disabled) {
        el.focus({ preventScroll: true });
        try { if (selStart !== null) el.setSelectionRange(selStart, selEnd); } catch (e) { /* number inputs */ }
      }
    }
  }

  /* ---------- Timers per step ---------- */
  function startStepTimers() {
    if (state.step === "waiting") {
      const t = setInterval(() => {
        if (state.waitIndex >= WAITING_MESSAGES.length - 1) return clearInterval(t);
        state.waitIndex++;
        if (state.waitIndex === WAITING_MESSAGES.length - 1) { clearInterval(t); render(true); }
        else { const s = document.getElementById("wait-status"); if (s) s.textContent = WAITING_MESSAGES[state.waitIndex]; }
      }, 1400);
      timers.push(t);
    }
    if (state.step === "episode") {
      timers.push(setInterval(() => {
        if (!state.player.playing) return;
        state.player.time = Math.min(EPISODE_LENGTH, state.player.time + 0.25 * state.player.speed);
        afterTimeChange();
      }, 250));
    }
  }
  function startCallTimer() {
    timers.push(setInterval(() => {
      state.call.seconds++;
      const el = document.getElementById("call-time");
      if (el) { el.textContent = fmt(state.call.seconds); el.setAttribute("aria-label", `Call duration ${fmt(state.call.seconds)}`); }
    }, 1000));
  }

  /* ---------- Events ---------- */
  function addChip(key) {
    const g = chipGroups()[key], v = (state.chipDrafts[key] || "").trim();
    if (!v || g.selected.length >= g.max || g.selected.some((s) => s.toLowerCase() === v.toLowerCase())) return;
    state.chipDrafts[key] = "";
    g.set([...g.selected, v]);
  }
  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const { action } = el.dataset;
    const p = state.player, c = state.call;
    switch (action) {
      case "goto": return goTo(el.dataset.step);
      case "restart": return restart();
      case "fill-sample": state.applicant = { ...SAMPLE_APPLICANT }; return render();
      case "sample-photo": return updateApplicant({ photo: SAMPLE_APPLICANT.photo });
      case "chip": {
        const g = chipGroups()[el.dataset.key], v = el.dataset.value;
        if (g.selected.includes(v)) g.set(g.selected.filter((s) => s !== v));
        else if (g.selected.length < g.max) g.set([...g.selected, v]);
        return;
      }
      case "chip-add": return addChip(el.dataset.key);
      case "play": p.playing = !p.playing; return render();
      case "speed": { const speeds = [1, 1.25, 1.5, 2]; p.speed = speeds[(speeds.indexOf(p.speed) + 1) % speeds.length]; return render(); }
      case "seek-rel": return seek(p.time + Number(el.dataset.delta));
      case "chapter": p.time = Number(el.dataset.start); p.playing = true; return render();
      case "listened": state.episodeListened = true; return render();
      case "join": c.joined = true; render(true); return startCallTimer();
      case "toggle-mic": c.mic = !c.mic; return render();
      case "toggle-cam": c.cam = !c.cam; return render();
      case "toggle-captions": c.captions = !c.captions; return render();
    }
  });
  root.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.field) return updateApplicant({ [t.dataset.field]: t.value });
    if (t.dataset.chipInput) { state.chipDrafts[t.dataset.chipInput] = t.value; return render(); }
    if (t.id === "episode-scrubber") return seek(Number(t.value));
  });
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "step-select") return goTo(t.value);
    if (t.id === "f-photo" && t.files && t.files[0]) return updateApplicant({ photo: URL.createObjectURL(t.files[0]) });
  });
  root.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.chipInput && e.key === "Enter" && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); addChip(t.dataset.chipInput); }
  });
  root.addEventListener("toggle", (e) => { if (e.target.id === "chapters") state.player.chaptersOpen = e.target.open; }, true);
  root.addEventListener("submit", (e) => {
    if (e.target.id !== "build-form") return;
    e.preventDefault();
    if (checklist(state.applicant).every((c) => c.done)) goTo("waiting");
    else { state.showErrors = true; render(); }
  });

  render(true);
})();
