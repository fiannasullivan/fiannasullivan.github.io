/* Katalyzr: read a LinkedIn profile PDF ("More → Save to PDF" on any LinkedIn profile) and turn it into
   card fields. Everything happens in the browser with pdf.js (vendor/pdfjs); the file is never uploaded.
   LinkedIn doesn't let other websites read profile pages from a link, so the PDF is how we get the details.

   LinkedIn's PDF layout: a left sidebar (Contact with the profile link, Top Skills, Languages, ...) and a
   main column (name, headline, location, Summary, Experience, Education). In Experience each role is
   Company / Title / "Month Year - Present (x months)" / location / description, and a company with several
   roles shows its total time ("2 years 3 months") under the company name. */
(function () {
  "use strict";

  const BASE = (document.currentScript && document.currentScript.src) || location.href;
  const PDFJS_URL = new URL("vendor/pdfjs/pdf.min.mjs", BASE).href;
  const WORKER_URL = new URL("vendor/pdfjs/pdf.worker.min.mjs", BASE).href;

  const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const MONTH_RE = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
  const DATE_LINE = new RegExp(`^(?:(${MONTH_RE})\\s+)?(\\d{4})\\s*[-–—]\\s*(present|(?:(${MONTH_RE})\\s+)?(\\d{4}))\\s*(?:\\(([^)]*)\\))?$`, "i");
  const TENURE_LINE = /^(\d+\s+years?)?\s*(\d+\s+months?)?$/i;
  const MAIN_HEADINGS = ["summary", "about", "experience", "education", "volunteer experience", "licenses & certifications", "licenses and certifications", "projects", "publications", "honors & awards", "honors-awards", "courses", "recommendations", "patents", "test scores", "organizations"];
  const SIDE_HEADINGS = ["contact", "top skills", "skills", "languages", "certifications", "honors-awards", "honors & awards", "publications", "patents", "summary"];

  /* ---------- Reading the PDF ---------- */
  let pdfjsPromise = null;
  function loadPdfJs() {
    if (!pdfjsPromise) {
      pdfjsPromise = import(PDFJS_URL).then((lib) => { lib.GlobalWorkerOptions.workerSrc = WORKER_URL; return lib; });
      pdfjsPromise.catch(() => { pdfjsPromise = null; }); // let a later try load it again
    }
    return pdfjsPromise;
  }
  // Text items with their position and size, per page
  async function readItems(data, lib) {
    lib = lib || (await loadPdfJs());
    const doc = await lib.getDocument({ data, isEvalSupported: false }).promise;
    const pages = [];
    for (let p = 1; p <= Math.min(doc.numPages, 8); p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      pages.push(tc.items.filter((it) => typeof it.str === "string" && it.str.trim()).map((it) => ({
        str: it.str, x: it.transform[4], y: it.transform[5], size: Math.round(Math.hypot(it.transform[2], it.transform[3]) * 10) / 10 || it.height || 0,
      })));
    }
    return pages;
  }
  async function readFile(file, lib) {
    const buf = await file.arrayBuffer();
    return parseItems(await readItems(new Uint8Array(buf), lib));
  }

  /* ---------- Turning positioned text into a profile ---------- */
  // Groups text into lines, keeping the sidebar and main column apart (they sit side by side)
  function toLines(pages) {
    const first = pages[0] || [];
    if (!first.length) return { side: [], main: [] };
    // The name is the largest text on page 1; everything left of it is the sidebar
    const nameItem = first.reduce((a, b) => (b.size > a.size ? b : a));
    const split = nameItem.x - 12;
    const side = [], main = [];
    pages.forEach((items, p) => {
      const groups = { side: [], main: [] };
      items.forEach((it) => groups[p === 0 && it.x < split ? "side" : (p > 0 && split > 120 && it.x < split ? "side" : "main")].push(it));
      for (const col of ["side", "main"]) {
        const sorted = groups[col].slice().sort((a, b) => b.y - a.y || a.x - b.x);
        let line = null;
        for (const it of sorted) {
          if (line && Math.abs(line.y - it.y) <= Math.max(2, it.size * 0.3)) { line.parts.push(it); line.size = Math.max(line.size, it.size); }
          else { line = { y: it.y, size: it.size, parts: [it], page: p }; (col === "side" ? side : main).push(line); }
        }
      }
    });
    const finish = (l) => ({ text: l.parts.sort((a, b) => a.x - b.x).map((x) => x.str).join(" ").replace(/\s+/g, " ").trim(), size: l.size, page: l.page });
    const notFooter = (l) => l.text && !/^page \d+ of \d+$/i.test(l.text);
    return { side: side.map(finish).filter(notFooter), main: main.map(finish).filter(notFooter), nameSize: nameItem.size };
  }

  function monthIndex(m) { if (!m) return null; const i = MONTHS.findIndex((x) => x.startsWith(m.toLowerCase().slice(0, 3))); return i < 0 ? null : i; }
  function parseDate(text) {
    const m = String(text).trim().match(DATE_LINE);
    if (!m) return null;
    const startMonth = monthIndex(m[1]), current = /present/i.test(m[3]);
    return {
      start: { year: +m[2], month: startMonth == null ? 0 : startMonth },
      end: current ? null : { year: +m[5], month: monthIndex(m[4]) == null ? 11 : monthIndex(m[4]) },
      current,
    };
  }
  const isHeading = (t, list) => list.includes(t.toLowerCase().replace(/\s+/g, " ").trim());
  const looksLikePlace = (t) => /,|united states|remote|\barea$/i.test(t) && t.length < 70;
  const looksLikeName = (t) => !!t && t.length <= 60 && !/[.!?;:]$/.test(t.trim()) && !parseDate(t) && !looksLikePlace(t);
  const isTenure = (t) => !!t && TENURE_LINE.test(t.trim()) && /\d/.test(t);

  function parseItems(pages) {
    const { side, main, nameSize } = toLines(pages);
    const out = { name: "", headline: "", location: "", url: "", summary: "", topSkills: [], experiences: [], education: [] };
    if (!main.length) return out;

    // Sidebar: profile link and Top Skills
    const sideText = side.map((l) => l.text).join("\n");
    const url = sideText.replace(/-\n/g, "-").replace(/\n(?=[\w-]+\s*\(LinkedIn\))/g, "").match(/linkedin\.com\/in\/[\w%-]+/i);
    if (url) out.url = "https://www." + url[0].replace(/^www\./i, "");
    const skillsAt = side.findIndex((l) => /^(top )?skills$/i.test(l.text));
    if (skillsAt >= 0) {
      for (let i = skillsAt + 1; i < side.length && !isHeading(side[i].text, SIDE_HEADINGS); i++) out.topSkills.push(side[i].text);
    }

    // Main column: name, then headline and location until the first section heading
    let i = main.findIndex((l) => l.size >= nameSize - 0.5);
    if (i < 0) i = 0;
    out.name = main[i].text;
    const intro = [];
    for (i = i + 1; i < main.length && !isHeading(main[i].text, MAIN_HEADINGS); i++) intro.push(main[i]);
    if (intro.length) {
      const headSize = intro[0].size;
      const head = intro.filter((l) => Math.abs(l.size - headSize) < 0.3), rest = intro.filter((l) => Math.abs(l.size - headSize) >= 0.3);
      if (rest.length) { out.headline = head.map((l) => l.text).join(" "); out.location = rest.map((l) => l.text).join(" "); }
      else if (intro.length > 1) { out.headline = intro.slice(0, -1).map((l) => l.text).join(" "); out.location = intro[intro.length - 1].text; }
      else out.headline = intro[0].text;
    }

    // Sections
    const sections = {};
    let current = null;
    for (; i < main.length; i++) {
      const t = main[i].text.toLowerCase().replace(/\s+/g, " ").trim();
      if (isHeading(t, MAIN_HEADINGS)) { current = t === "about" ? "summary" : t; sections[current] = []; continue; }
      if (current) sections[current].push(main[i]);
    }
    if (sections.summary) out.summary = sections.summary.map((l) => l.text).join(" ").replace(/\s+/g, " ").trim();
    if (sections.experience) out.experiences = parseExperience(sections.experience);
    if (sections.education) out.education = sections.education.map((l) => l.text);
    return out;
  }

  function parseExperience(lines) {
    // 1. Find each role: its date line, its title (the line above), and whether a new company starts above that
    const found = [];
    for (let i = 1; i < lines.length; i++) {
      const d = parseDate(lines[i].text);
      if (!d) continue;
      const titleLine = lines[i - 1], before = lines[i - 2], before2 = lines[i - 3];
      let company = null, blockStart = i - 1;
      if (before && isTenure(before.text) && before2) { company = before2.text; blockStart = i - 3; } // a company with several roles
      else if (before && !parseDate(before.text) && (before.size > titleLine.size + 0.1 || (Math.abs(before.size - titleLine.size) < 0.1 && looksLikeName(before.text)))) { company = before.text; blockStart = i - 2; } // company names are a little bigger than titles
      else if (!before) blockStart = i - 1;
      found.push({ i, d, title: titleLine.text, company, blockStart });
    }
    // 2. Each description runs from after the date to where the next role starts
    let company = "";
    return found.map((r, n) => {
      if (r.company) company = r.company;
      else if (!company && r.blockStart > 0) company = lines[r.blockStart - 1].text;
      const stop = n + 1 < found.length ? found[n + 1].blockStart : lines.length;
      const desc = lines.slice(r.i + 1, Math.max(r.i + 1, stop)).map((l) => l.text);
      if (desc.length && looksLikePlace(desc[0])) desc.shift(); // location line
      return { company, title: r.title, ...r.d, description: desc.join(" ").replace(/\s+/g, " ").trim() };
    });
  }

  /* ---------- Profile → card ---------- */
  const SKILL_MAP = [
    [/systems? thinking|systems design/i, "Systems thinking"],
    [/^operations|operations management|business operations|supply chain|logistics/i, "Operations"],
    [/product (strategy|management|manager)|product development/i, "Product strategy"],
    [/go[- ]to[- ]market|gtm/i, "Go-to-market"],
    [/data analy|analytics|business intelligence|sql|tableau|power bi/i, "Data analysis"],
    [/fundrais|venture capital|investor relations/i, "Fundraising"],
    [/engineering (management|leadership)|technical leadership/i, "Engineering leadership"],
    [/^brand|branding|brand strategy/i, "Brand"],
    [/team (building|leadership)|leadership|people management|team management|coaching|mentoring/i, "Team building"],
    [/negotiat/i, "Negotiation"],
  ];
  function mapSkill(s) { for (const [re, v] of SKILL_MAP) if (re.test(s)) return v; return null; }
  const monthsBetween = (a, b) => (b.year - a.year) * 12 + (b.month - a.month) + 1;
  // Total time worked, counting overlapping jobs only once
  function yearsWorked(roles, now = new Date()) {
    const today = { year: now.getFullYear(), month: now.getMonth() };
    const spans = roles.map((r) => [r.start.year * 12 + r.start.month, (r.end || today).year * 12 + (r.end || today).month]).filter(([a, b]) => b >= a).sort((a, b) => a[0] - b[0]);
    let total = 0, cur = null;
    for (const s of spans) {
      if (!cur || s[0] > cur[1] + 1) { if (cur) total += cur[1] - cur[0] + 1; cur = [...s]; }
      else cur[1] = Math.max(cur[1], s[1]);
    }
    if (cur) total += cur[1] - cur[0] + 1;
    return total;
  }
  const firstSentence = (t, max = 170) => {
    const s = String(t || "").replace(/\s+/g, " ").trim();
    if (!s) return "";
    const m = s.match(/^.{20,}?[.!?](?=\s|$)/);
    const out = m ? m[0] : s;
    return out.length > max ? out.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : out;
  };
  function monthName(d) { return d ? MONTHS[d.month][0].toUpperCase() + MONTHS[d.month].slice(1, 3) + " " + d.year : ""; }

  // Returns the card fields to fill, plus lists of what was and wasn't found (shown to the user)
  function toCard(profile, options = {}) {
    const { techSkills = [], personalSkills = [], now = new Date() } = options;
    const patch = {}, filled = [], missing = [], notes = [];
    if (profile.name) { patch.name = profile.name; filled.push("Name"); } else missing.push("Name");

    const roles = profile.experiences || [];
    const current = roles.filter((r) => r.current).sort((a, b) => b.start.year * 12 + b.start.month - (a.start.year * 12 + a.start.month))[0];
    const latest = current || roles.slice().sort((a, b) => (b.end ? b.end.year * 12 + b.end.month : 1e9) - (a.end ? a.end.year * 12 + a.end.month : 1e9))[0];
    if (latest) {
      patch.role = [latest.title, latest.company].filter(Boolean).join(", ");
      filled.push(current ? "Current role" : "Most recent role");
      if (!current) notes.push(`You don’t have a current role on LinkedIn, so we used your most recent one (ended ${monthName(latest.end)}).`);
    } else if (profile.headline) { patch.role = profile.headline; filled.push("Role (from your headline)"); }
    else missing.push("Role");

    const months = yearsWorked(roles, now);
    if (months > 0) { patch.experienceYears = String(Math.max(1, Math.round(months / 12))); filled.push("Years worked"); }
    else missing.push("Years worked");

    const built = firstSentence(profile.summary) || firstSentence(latest && latest.description) || "";
    if (built) { patch.experience = built; filled.push(profile.summary ? "What you’ve built (from your About)" : "What you’ve built (from your latest role)"); }
    else missing.push("What you’ve built");

    const tech = [], personal = [];
    for (const raw of profile.topSkills || []) {
      const mapped = mapSkill(raw);
      const v = mapped || raw.trim();
      if (!v) continue;
      if (personalSkills.includes(v)) { if (personal.length < 3 && !personal.includes(v)) personal.push(v); }
      else if (tech.length < 3 && !tech.includes(v)) tech.push(v);
    }
    if (tech.length + personal.length) {
      patch.skills = [...tech, ...personal];
      patch.customPersonalSkills = [];
      filled.push(`Skills (${tech.length + personal.length})`);
      if (tech.length + personal.length < 2) notes.push("LinkedIn only shares your top skills. Pick at least one more below.");
    } else missing.push("Skills");

    if (profile.url) patch.linkedinUrl = profile.url;
    return { patch, filled, missing, notes, roles: roles.length };
  }

  // Do two links point at the same LinkedIn profile?
  function sameProfile(a, b) {
    const slug = (u) => (String(u || "").match(/linkedin\.com\/in\/([\w%-]+)/i) || [])[1];
    const x = slug(a), y = slug(b);
    return !x || !y || decodeURIComponent(x).toLowerCase() === decodeURIComponent(y).toLowerCase();
  }

  window.KatalyzrLinkedIn = { loadPdfJs, readFile, readItems, parseItems, toCard, sameProfile, yearsWorked, parseDate };
})();
