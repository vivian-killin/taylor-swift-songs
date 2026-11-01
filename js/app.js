/* Screens and interaction. State lives in `state`; every change saves and re-renders. */
(function () {
  const { CATALOG, MAX_PER_SECTION, TOP_N, MAX_NAME, sectionOf, analyze, searchSongs, cleanName, versionLabel, encodeResult, decodeResult } = window.TS;
  const STORAGE_KEY = "top10-your-version-v1";
  const SHELL_THEME = { bg: "#251433", ink: "#FBF3E4", accent: "#F5C95D", accentInk: "#2A1800" };
  const QUIZ_FONT = {
    display: { family: "Jost", weight: 700, scale: 1, sans: true },
    text: { family: "Jost", sans: true },
  };
  const SYSTEM_TEXT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const SITE_URL = (window.TS_CONFIG.siteUrl || location.origin + location.pathname).replace(/\/$/, "");
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");

  const newState = () => ({ screen: "intro", section: 0, picks: [], top: [], name: "" });
  let state = newState();
  let friendResult = null;
  let searchQuery = "";

  /* localStorage can throw in private windows, so progress saving is best-effort. */
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* no saving */ }
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !Array.isArray(saved.picks) || !Array.isArray(saved.top)) return null;
      saved.picks = saved.picks.filter((id) => CATALOG.byId.has(id));
      saved.top = saved.top.filter((id) => saved.picks.includes(id));
      saved.name = cleanName(saved.name);
      saved.section = Math.min(Math.max(0, saved.section | 0), CATALOG.sections.length - 1);
      return saved;
    } catch (e) { return null; }
  }
  function clearSaved() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nothing saved */ }
  }

  /* Small element builder. Song titles go in as text, never as HTML. */
  function h(tag, props, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value === false || value == null) continue;
      if (key === "class") node.className = value;
      else if (key === "on") Object.entries(value).forEach(([ev, fn]) => node.addEventListener(ev, fn));
      else if (key === "style") Object.assign(node.style, value);
      else node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child != null && child !== false) node.append(child);
    }
    return node;
  }

  let toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }
  /* Album fonts load only when a result needs one, to keep the quiz light. */
  const fontLoads = new Map();
  function ensureFont(spec) {
    if (!spec || !spec.css) return Promise.resolve();
    if (fontLoads.has(spec.css)) return fontLoads.get(spec.css);
    const loaded = new Promise((resolve) => {
      const link = h("link", { rel: "stylesheet", href: `https://fonts.googleapis.com/css2?family=${spec.css}&display=swap` });
      link.onload = resolve;
      link.onerror = resolve;
      document.head.append(link);
    });
    fontLoads.set(spec.css, loaded);
    return loaded;
  }
  function applyFont(font) {
    const css = document.documentElement.style;
    const { display, text } = font;
    const stack = (spec) => `"${spec.family}", ${spec.sans ? SYSTEM_TEXT : 'Georgia, "Times New Roman", serif'}`;
    css.setProperty("--display", stack(display));
    css.setProperty("--display-weight", display.weight);
    css.setProperty("--display-style", display.italic ? "italic" : "normal");
    css.setProperty("--display-case", display.upper ? "uppercase" : "none");
    css.setProperty("--display-scale", display.scale);
    css.setProperty("--text", text ? stack(text) : SYSTEM_TEXT);
    css.setProperty("--digits", display.oldstyleDigits ? "var(--text)" : "var(--display)");
  }

  function applyTheme(theme, font = QUIZ_FONT) {
    applyFont(font);
    const css = document.documentElement.style;
    css.setProperty("--bg", theme.bg);
    css.setProperty("--ink", theme.ink);
    css.setProperty("--ink-rgb", hexToRgb(theme.ink));
    css.setProperty("--accent", theme.accent);
    css.setProperty("--accent-ink", theme.accentInk);
    document.querySelector('meta[name="theme-color"]').setAttribute("content", theme.bg);
  }

  function metaLine(song, withAlbum) {
    const bits = [];
    if (withAlbum) bits.push(sectionOf(song).short);
    if (song.feat) bits.push(song.kind === "collab" ? `with ${song.feat}` : `feat. ${song.feat}`);
    if (song.note) bits.push(song.note);
    if (song.vault) bits.push("From the Vault");
    if (song.tag) bits.push(song.tag);
    return bits.join(" · ");
  }

  function go(screen, extra) {
    toastEl.classList.remove("show");
    searchQuery = "";
    Object.assign(state, { screen }, extra);
    save();
    history.pushState({ screen: state.screen, section: state.section }, "", location.pathname + location.search);
    render({ focus: true });
  }

  /* Re-render after a tap without losing the person's place or keyboard focus. */
  function refreshInPlace(songId) {
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    const row = app.querySelector(`[data-song="${songId}"]`);
    if (row) row.focus({ preventScroll: true });
  }

  const picksIn = (section) => state.picks.filter((id) => CATALOG.byId.get(id).section === section.code);

  function togglePick(song, section) {
    if (state.picks.includes(song.id)) {
      state.picks = state.picks.filter((id) => id !== song.id);
      state.top = state.top.filter((id) => id !== song.id);
    } else if (picksIn(section).length >= MAX_PER_SECTION) {
      toast(`That's ${MAX_PER_SECTION} from ${section.short}. Untap one to swap it.`);
      return;
    } else {
      state.picks.push(song.id);
    }
    save();
    refreshInPlace(song.id);
  }

  /* ---------- Intro ---------- */
  function renderIntro() {
    applyTheme(SHELL_THEME);
    const saved = state.picks.length > 0;
    return [
      h("section", { class: "intro" },
        h("div", { class: "sparkle", "aria-hidden": "true" }, "✦✧✦"),
        h("h1", { tabindex: "-1" }, "Top 10 ", h("em", null, "(Your Version)")),
        h("p", { class: "lede" }, "Rank your top 10 favorite Taylor Swift songs, then find out what your taste says about you!"),
        h("ol", { class: "steps" },
          h("li", null, h("span", null, `Pick up to ${MAX_PER_SECTION} per album (or collabs/movies/whatever) to start narrowing down.`)),
          h("li", null, h("span", null, "From the ones you picked, choose your top 10.")),
          h("li", null, h("span", null, "Get your album breakdown and share with pals!"))),
        h("button", { class: "btn", on: { click: () => (saved ? go("section") : go("section", { section: 0 })) } }, saved ? "Pick up where you left off" : "Start ranking"),
        saved && h("button", { class: "btn ghost", on: { click: restart } }, "Start over"),
        h("p", { class: "fine" }, "Not actually affiliated with Taylor Swift except in Vivian's parasocial dreams")),
    ];
  }

  function restart() {
    if (!window.confirm("Start over? This clears your picks, your results and your name.")) return;
    clearSaved();
    state = newState();
    friendResult = null;
    searchQuery = "";
    cardState.run++;
    cardState.blobs = [];
    history.replaceState({ screen: "intro", section: 0 }, "", location.pathname + location.search);
    render({ focus: true });
  }

  /* Opening a friend's link shouldn't cost you your own progress. */
  function leaveFriendResult() {
    friendResult = null;
    history.replaceState({ screen: "intro", section: 0 }, "", location.pathname + location.search);
    state = load() || newState();
    state.screen = "intro";
    render({ focus: true });
  }

  /* ---------- Album steps ---------- */
  function afterSections() {
    if (state.picks.length < TOP_N) go("short");
    else if (state.picks.length === TOP_N) {
      state.top = keepOrder(state.top, state.picks);
      go("rank");
    } else go("cut");
  }
  /* Keep the existing order, and add anything new at the end. */
  function keepOrder(order, all) {
    return [...order.filter((id) => all.includes(id)), ...all.filter((id) => !order.includes(id))];
  }

  function renderSection() {
    const section = CATALOG.sections[state.section];
    applyTheme(section.theme);
    const count = picksIn(section).length;
    const last = state.section === CATALOG.sections.length - 1;
    const next = () => (last ? afterSections() : go("section", { section: state.section + 1 }));
    const back = () => (state.section === 0 ? go("intro") : go("section", { section: state.section - 1 }));

    const row = (song, withAlbum) => {
      const home = sectionOf(song);
      const on = state.picks.includes(song.id);
      const locked = !on && picksIn(home).length >= MAX_PER_SECTION;
      const meta = metaLine(song, withAlbum);
      return h("button", {
        class: `song${locked ? " locked" : ""}`,
        "aria-pressed": on ? "true" : "false",
        "data-song": song.id,
        on: { click: () => togglePick(song, home) },
      },
        h("span", { class: "text" }, h("span", { class: "title" }, song.title), meta && h("span", { class: "meta" }, meta)),
        h("span", { class: "check", "aria-hidden": "true" }));
    };

    /* Search spans every album, so "this page" only applies when not searching. */
    const countEl = h("div", { class: "count" });
    const paintCount = () => {
      const total = `${state.picks.length} picked total`;
      countEl.replaceChildren(
        searchQuery.trim() ? total : `${count} of ${MAX_PER_SECTION} on this page`,
        h("small", null, searchQuery.trim() ? `up to ${MAX_PER_SECTION} per album` : total));
    };

    /* Typing only redraws this list and the counter, so the keyboard stays open. */
    const listArea = h("div", { class: "song-list" });
    const paintList = () => {
      paintCount();
      if (!searchQuery.trim()) {
        listArea.replaceChildren(...(section.groups
          ? section.groups.flatMap((g) => [h("div", { class: "group-name" }, g.name), ...section.list.filter((s) => s.group === g.name).map((s) => row(s, false))])
          : section.list.map((s) => row(s, false))));
        return;
      }
      const matches = searchSongs(searchQuery);
      listArea.replaceChildren(
        h("p", { class: "search-count muted", role: "status" }, matches.length
          ? `${matches.length} ${matches.length === 1 ? "song" : "songs"} across all albums`
          : `No songs match "${searchQuery.trim()}". Live versions and remixes aren't in this list.`),
        ...matches.map((s) => row(s, true)));
    };

    const clearBtn = h("button", {
      class: "search-clear",
      type: "button",
      "aria-label": "Clear search",
      on: { click: () => {
        searchQuery = "";
        searchInput.value = "";
        clearBtn.hidden = true;
        paintList();
        searchInput.focus();
      } },
    }, "×");
    clearBtn.hidden = !searchQuery;
    const searchInput = h("input", {
      type: "search",
      value: searchQuery,
      placeholder: "Search all songs",
      "aria-label": "Search all songs, on any album",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: "false",
      enterkeyhint: "search",
      on: {
        input: (e) => {
          searchQuery = e.target.value;
          clearBtn.hidden = !searchQuery;
          paintList();
        },
        keydown: (e) => { if (e.key === "Enter") e.target.blur(); },
      },
    });
    paintList();

    return [
      h("div", { class: "top" },
        h("button", { class: "back", on: { click: back } }, "← Back"),
        h("span", { class: "muted" }, `${state.section + 1} of ${CATALOG.sections.length}`)),
      h("div", { class: "dots" }, CATALOG.sections.map((s, i) => h("button", {
        class: `dot${i === state.section ? " now" : i < state.section ? " done" : ""}`,
        "aria-label": `Go to ${s.title}`,
        "aria-current": i === state.section ? "step" : null,
        on: { click: () => go("section", { section: i }) },
      }))),
      h("div", { class: "head" },
        h("h1", { tabindex: "-1" }, section.title),
        h("p", { class: "muted" }, section.year
          ? `${section.year} · Tap your favorites, up to ${MAX_PER_SECTION}, or skip it.`
          : `Movies, collabs and rarities. Tap up to ${MAX_PER_SECTION}, or skip it.`)),
      h("div", { class: "search" }, searchInput, clearBtn),
      listArea,
      h("div", { class: "bar" }, h("div", { class: "bar-inner" },
        countEl,
        h("button", { class: "btn", on: { click: next } }, last ? "Done picking" : count === 0 ? "Skip" : "Next"))),
    ];
  }

  /* ---------- Too few picks ---------- */
  function renderShort() {
    applyTheme(SHELL_THEME);
    const need = TOP_N - state.picks.length;
    return [
      h("div", { class: "top" }, h("button", { class: "back", on: { click: () => go("section") } }, "← Back")),
      h("div", { class: "head" },
        h("h1", { tabindex: "-1" }, `${need} more to go`),
        h("p", { class: "muted" }, `A top 10 needs 10 songs, and you've picked ${state.picks.length}. Head back and find ${need === 1 ? "one more" : `${need} more`}.`)),
      CATALOG.sections.map((section, i) => h("button", {
        class: "song",
        on: { click: () => go("section", { section: i }) },
      },
        h("span", { class: "text" }, h("span", { class: "title" }, section.title)),
        h("span", { class: "muted" }, `${picksIn(section).length} picked`),
        h("span", { class: "chev", "aria-hidden": "true" }, "›"))),
    ];
  }

  /* ---------- Cut to 10 ---------- */
  function renderCut() {
    applyTheme(SHELL_THEME);
    state.top = state.top.filter((id) => state.picks.includes(id));
    const count = state.top.length;

    const toggle = (song) => {
      if (state.top.includes(song.id)) state.top = state.top.filter((id) => id !== song.id);
      else if (count >= TOP_N) { toast("That's 10. Untap one to swap it."); return; }
      else state.top.push(song.id);
      save();
      refreshInPlace(song.id);
    };

    return [
      h("div", { class: "top" },
        h("button", { class: "back", on: { click: () => go("section", { section: CATALOG.sections.length - 1 }) } }, "← Back"),
        h("span", { class: "muted" }, `${state.picks.length} on your shortlist`)),
      h("div", { class: "head" },
        h("h1", { tabindex: "-1" }, "Narrow it down!"),
        h("p", { class: "muted" }, "Keep your 10 favorites. You'll rank them; the rest still count toward your album breakdown.")),
      CATALOG.sections.filter((s) => picksIn(s).length > 0).map((section) => [
        h("div", { class: "group-name" }, section.title),
        picksIn(section).map((id) => {
          const song = CATALOG.byId.get(id);
          const on = state.top.includes(id);
          const meta = metaLine(song, false);
          return h("button", {
            class: `song${!on && count >= TOP_N ? " locked" : ""}`,
            "aria-pressed": on ? "true" : "false",
            "data-song": song.id,
            on: { click: () => toggle(song) },
          },
            h("span", { class: "text" }, h("span", { class: "title" }, song.title), meta && h("span", { class: "meta" }, meta)),
            h("span", { class: "check", "aria-hidden": "true" }));
        }),
      ]),
      h("div", { class: "bar" }, h("div", { class: "bar-inner" },
        h("div", { class: "count" }, `${count} of ${TOP_N}`, h("small", null, "kept")),
        h("button", { class: "btn", disabled: count !== TOP_N, on: { click: () => go("rank") } },
          count === TOP_N ? "Rank them" : `Keep ${TOP_N - count} more`))),
    ];
  }

  /* ---------- Rank ---------- */
  function renderRank() {
    applyTheme(SHELL_THEME);
    const move = (from, to) => {
      const [id] = state.top.splice(from, 1);
      state.top.splice(to, 0, id);
      save();
    };
    const list = h("ol", { class: "rank-list" });

    const paint = () => {
      list.replaceChildren(...state.top.map((id, i) => {
        const song = CATALOG.byId.get(id);
        const nudge = (delta) => {
          move(i, i + delta);
          paint();
          const again = list.children[i + delta].querySelector(delta < 0 ? ".up" : ".down");
          (again && !again.disabled ? again : list.children[i + delta].querySelector(".handle")).focus();
        };
        return h("li", { class: "rank-row", "data-index": i },
          h("span", { class: "rank-num" }, String(i + 1)),
          h("span", { class: "text" }, h("span", { class: "title" }, song.title), h("span", { class: "meta" }, sectionOf(song).short)),
          h("button", { class: "icon-btn up", "aria-label": `Move ${song.title} up`, disabled: i === 0, on: { click: () => nudge(-1) } }, "↑"),
          h("button", { class: "icon-btn down", "aria-label": `Move ${song.title} down`, disabled: i === TOP_N - 1, on: { click: () => nudge(1) } }, "↓"),
          h("button", { class: "handle", "aria-label": `Drag to reorder ${song.title}`, on: { pointerdown: (e) => startDrag(e, i) } }, h("span")));
      }));
    };

    /* The dragged row follows the finger; the others slide aside. The order commits on release. */
    function startDrag(event, from) {
      event.preventDefault();
      const handle = event.currentTarget;
      const rows = [...list.children];
      const dragged = rows[from];
      const tops = rows.map((r) => r.getBoundingClientRect().top + window.scrollY);
      const heights = rows.map((r) => r.getBoundingClientRect().height);
      const gap = 6;
      const startY = event.clientY + window.scrollY;
      let pointerY = event.clientY;
      let to = from;
      let raf = 0;
      dragged.classList.add("dragging");
      try { handle.setPointerCapture(event.pointerId); } catch (e) { /* synthetic pointer */ }

      const update = () => {
        const dy = pointerY + window.scrollY - startY;
        dragged.style.transform = `translateY(${dy}px) scale(1.02)`;
        const middle = tops[from] + heights[from] / 2 + dy;
        to = from;
        rows.forEach((row, i) => {
          if (i < from && middle < tops[i] + heights[i] / 2) to = Math.min(to, i);
          if (i > from && middle > tops[i] + heights[i] / 2) to = Math.max(to, i);
        });
        rows.forEach((row, i) => {
          if (i === from) return;
          let shift = 0;
          if (i > from && i <= to) shift = -(heights[from] + gap);
          if (i < from && i >= to) shift = heights[from] + gap;
          row.style.transform = shift ? `translateY(${shift}px)` : "";
        });
      };
      const tick = () => {
        const edge = 72;
        if (pointerY < edge) window.scrollBy(0, -8);
        else if (pointerY > window.innerHeight - edge - 76) window.scrollBy(0, 8);
        update();
        raf = requestAnimationFrame(tick);
      };
      const onMove = (e) => { pointerY = e.clientY; };
      const finish = () => {
        cancelAnimationFrame(raf);
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", finish);
        handle.removeEventListener("pointercancel", finish);
        rows.forEach((r) => { r.style.transform = ""; });
        dragged.classList.remove("dragging");
        if (to !== from) move(from, to);
        paint();
      };
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
      raf = requestAnimationFrame(tick);
    }

    paint();
    const back = () => (state.picks.length === TOP_N ? go("section", { section: CATALOG.sections.length - 1 }) : go("cut"));
    return [
      h("div", { class: "top" }, h("button", { class: "back", on: { click: back } }, "← Back")),
      h("div", { class: "head" },
        h("h1", { tabindex: "-1" }, "Put them in order"),
        h("p", { class: "muted" }, "Drag the ≡ handle, or use the arrows. #1 is forever, so choose carefully.")),
      list,
      h("div", { class: "bar" }, h("div", { class: "bar-inner" },
        h("button", { class: "btn", on: { click: () => go("results") } }, "See my results"))),
    ];
  }

  /* ---------- Results ---------- */
  const siteLabel = () => SITE_URL.replace(/^https?:\/\//, "");
  const shareLink = (top, picks, name) => `${SITE_URL}/#${encodeResult(top, picks, name)}`;
  const listTitle = (name, fallback) => `Top 10 Taylor Swift Songs: ${versionLabel(name, fallback)}`;

  const CARDS = [
    { kind: "top10", label: "Top 10", file: "top-10-taylor-swift-songs.png", alt: "Top 10 songs and persona" },
    { kind: "albums", label: "Albums", file: "taylor-swift-album-breakdown.png", alt: "Album breakdown" },
    { kind: "superlatives", label: "Superlatives", file: "taylor-swift-superlatives.png", alt: "Persona and superlatives" },
  ];

  /* Sharing a file must start right from the tap on iPhones, so the images are made ahead of time. */
  const cardState = { run: 0, current: 0, blobs: [], urls: [] };
  async function refreshCards(result, name, imgs) {
    const run = ++cardState.run;
    cardState.blobs = [];
    const font = result.topAlbum.font;
    await Promise.all([ensureFont(font.display), ensureFont(font.text)]);
    for (let i = 0; i < CARDS.length; i++) {
      const blob = await window.drawShareImage(result, { name, site: siteLabel(), kind: CARDS[i].kind });
      if (run !== cardState.run) return;
      if (!blob) continue;
      if (cardState.urls[i]) URL.revokeObjectURL(cardState.urls[i]);
      cardState.blobs[i] = blob;
      cardState.urls[i] = URL.createObjectURL(blob);
      imgs[i].src = cardState.urls[i];
    }
  }

  const cardFile = (i) => new File([cardState.blobs[i]], CARDS[i].file, { type: "image/png" });

  const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  /* iPhones save downloads to Files. The share sheet's "Save Image" is how a site reaches Photos. */
  async function saveCards(indexes) {
    if (!indexes.every((i) => cardState.blobs[i])) { toast("One moment, still making your images."); return; }
    if (isIOS()) {
      const files = indexes.map(cardFile);
      if (!navigator.canShare || !navigator.canShare({ files })) {
        toast("Press and hold an image to save it.");
        return;
      }
      try { await navigator.share({ files }); }
      catch (e) { if (e.name !== "AbortError") toast("Press and hold an image to save it."); }
      return;
    }
    indexes.forEach((i, order) => setTimeout(() => {
      const a = h("a", { href: cardState.urls[i], download: CARDS[i].file });
      document.body.append(a);
      a.click();
      a.remove();
    }, order * 400));
    toast(indexes.length > 1 ? "Images saved" : "Image saved");
  }

  async function shareCard(title) {
    const i = cardState.current;
    const text = `${title}. Make yours: ${SITE_URL}`;
    const data = { title, text };
    if (cardState.blobs[i] && navigator.canShare && navigator.canShare({ files: [cardFile(i)] })) data.files = [cardFile(i)];
    if (navigator.share) {
      try { await navigator.share(data); return; }
      catch (e) { if (e.name === "AbortError") return; }
    }
    copyText(text, "Copied. Paste it anywhere!");
  }

  async function copyText(value, message) {
    try {
      await navigator.clipboard.writeText(value);
      toast(message);
    } catch (e) {
      window.prompt("Copy this:", value);
    }
  }

  function renderResults() {
    const friend = !!friendResult;
    const data = friendResult || state;
    const result = analyze(data.top, data.picks);
    const font = result.topAlbum.font;
    applyTheme(result.topAlbum.theme, font);
    ensureFont(font.display);
    ensureFont(font.text);

    const maxScore = result.topAlbum.score;
    const fallback = friend ? "A Friend's Version" : "My Version";
    const friendName = friend ? cleanName(data.name) : "";

    const heading = h("h2");
    const setHeading = (name) => heading.replaceChildren(
      "Top ", h("span", { class: "digits" }, "10"), listTitle(name, fallback).replace("Top 10", ""));
    setHeading(data.name);
    const previews = CARDS.map((c) => h("img", { class: "card-preview", alt: `Share image: ${c.alt}` }));

    let shareSection = null;
    if (!friend) {
      let timer;
      const nameInput = h("input", {
        type: "text",
        maxlength: MAX_NAME,
        value: state.name,
        placeholder: "Your name",
        autocomplete: "given-name",
        enterkeyhint: "done",
        on: {
          input: (e) => {
            state.name = cleanName(e.target.value);
            save();
            setHeading(state.name);
            clearTimeout(timer);
            timer = setTimeout(() => refreshCards(result, state.name, previews), 250);
          },
          keydown: (e) => { if (e.key === "Enter") e.target.blur(); },
        },
      });
      /* Swipe between cards, or tap a tab. Save and Share act on the card in view. */
      cardState.current = 0;
      const tabs = CARDS.map((c, i) => h("button", {
        class: "card-tab",
        "aria-pressed": i === 0 ? "true" : "false",
        on: { click: () => {
          const slide = scroller.children[i];
          scroller.scrollTo({ left: slide.offsetLeft - (scroller.clientWidth - slide.offsetWidth) / 2, behavior: "smooth" });
        } },
      }, c.label));
      const setCurrent = (i) => {
        cardState.current = i;
        tabs.forEach((tab, t) => tab.setAttribute("aria-pressed", t === i ? "true" : "false"));
      };
      const scroller = h("div", {
        class: "card-scroller",
        on: { scroll: () => {
          const middle = scroller.scrollLeft + scroller.clientWidth / 2;
          const slides = [...scroller.children];
          const distance = (el) => Math.abs(el.offsetLeft + el.offsetWidth / 2 - middle);
          setCurrent(slides.indexOf(slides.reduce((best, el) => (distance(el) < distance(best) ? el : best))));
        } },
      }, previews.map((img) => h("div", { class: "card-slide" }, img)));

      shareSection = h("section", { class: "panel share", id: "share" },
        h("h2", null, "Share your results"),
        h("label", { class: "field" }, "Add your name (optional)", nameInput),
        h("p", { class: "swipe-note muted" }, "Swipe for all 3 cards."),
        h("div", { class: "card-tabs" }, tabs),
        scroller,
        h("div", { class: "share-row" },
          h("button", { class: "btn", on: { click: () => saveCards([cardState.current]) } }, isIOS() ? "Save to Photos" : "Save image"),
          h("button", { class: "btn ghost", on: { click: () => shareCard(listTitle(state.name, fallback)) } }, "Share")),
        h("p", { class: "hint" }, isIOS()
          ? "Then tap \"Save Image\" in the menu that opens."
          : "Image won't save? Press and hold it instead."),
        h("button", { class: "link-btn copy-link", on: { click: () => saveCards(CARDS.map((c, i) => i)) } }, "Save all 3 cards"),
        h("button", {
          class: "link-btn copy-link",
          on: { click: () => copyText(shareLink(state.top, state.picks, state.name), "Link copied") },
        }, "Copy a link to my full results"));
      refreshCards(result, state.name, previews);
    }

    const stickyBar = h("div", { class: "bar" }, h("div", { class: "bar-inner" },
      friend
        ? h("button", { class: "btn", on: { click: leaveFriendResult } }, "Make your own")
        : h("button", { class: "btn", on: { click: () => shareSection.scrollIntoView({ behavior: "smooth" }) } }, "Share my list ↓")));
    if (shareSection) {
      resultsObserver = new IntersectionObserver(([entry]) => { stickyBar.hidden = entry.isIntersecting; });
      resultsObserver.observe(shareSection);
    }

    return [
      friend && h("p", { class: "friend-note" }, friendName ? `${friendName} shared their results with you.` : "A friend shared their results with you."),
      h("section", { class: "result-hero" },
        h("p", { class: "kicker" }, friend ? (friendName ? `${friendName} is` : "They are") : "You are"),
        h("h1", { tabindex: "-1" }, result.persona.name),
        h("p", { class: "line" }, result.persona.line),
        h("p", { class: "roast" }, result.persona.roast),
        h("div", { class: "stats" },
          h("div", { class: "stat" }, h("b", { class: result.topAlbum.short.length > 8 ? "long" : null }, result.topAlbum.short), h("span", null, "top album")),
          h("div", { class: "stat" }, h("b", { class: "digits" }, String(result.avgYear)), h("span", null, "average era")),
          h("div", { class: "stat" }, h("b", { class: "digits" }, `${result.albumsRepresented} of ${CATALOG.sections.length}`), h("span", null, "sections picked")))),
      h("section", { class: "panel" },
        heading,
        h("ol", { class: "final" }, result.topSongs.map((song, i) => {
          const meta = metaLine(song, true);
          return h("li", null,
            h("span", { class: "rank-num" }, String(i + 1)),
            h("span", null, h("span", { class: "title" }, song.title), h("span", { class: "meta" }, meta)));
        }))),
      h("section", { class: "panel" },
        h("h2", null, "By album"),
        h("p", { class: "sub" }, `${result.streak} Every shortlisted song earns a point, with up to 10 more for a spot in the top 10.`),
        result.albums.filter((a) => a.score > 0).map((album) => h("div", { class: "album-row" },
          h("div", { class: "label" },
            h("span", { class: "swatch", style: { background: album.theme.bg }, "aria-hidden": "true" }),
            h("span", { class: "name" }, album.short),
            h("span", { class: "val" }, `${album.score} pts · ${album.inTop} in top 10`)),
          h("div", { class: "track", "aria-hidden": "true" },
            h("div", { class: "fill", style: { width: `${(album.score / maxScore) * 100}%` } }))))),
      h("section", { class: "panel" },
        h("h2", null, "Superlatives"),
        h("p", { class: "sub" }, "Voted most likely by nobody but your own list."),
        result.superlatives.map((s) => h("div", { class: "super" }, h("b", { class: /\d/.test(s.name) ? "digits" : null }, s.name), s.blurb))),
      shareSection,
      !friend && h("div", { class: "actions" },
        h("button", { class: "btn ghost", on: { click: () => go("rank") } }, "Change my order"),
        h("button", { class: "link-btn start-over", on: { click: restart } }, "Start over and clear my results")),
      stickyBar,
      h("p", { class: "fine" }, "A fan-made project, not affiliated with Taylor Swift or her labels."),
    ];
  }

  /* ---------- Render ---------- */
  const SCREENS = { intro: renderIntro, section: renderSection, short: renderShort, cut: renderCut, rank: renderRank, results: renderResults };

  let resultsObserver = null;
  function render(options) {
    if (resultsObserver) { resultsObserver.disconnect(); resultsObserver = null; }
    let screen = friendResult ? "results" : state.screen;
    /* A saved state may no longer support the screen it was on. */
    if (!friendResult && (screen === "rank" || screen === "results") && state.top.length !== TOP_N) {
      screen = state.picks.length > TOP_N ? "cut" : "section";
      state.screen = screen;
    }
    if (!friendResult && screen === "cut" && state.picks.length <= TOP_N) {
      screen = "section";
      state.screen = screen;
    }
    app.replaceChildren(...SCREENS[screen]().flat(Infinity).filter(Boolean));
    if (options && options.focus) {
      window.scrollTo(0, 0);
      const heading = app.querySelector("h1");
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  friendResult = decodeResult(location.hash);
  if (!friendResult) state = load() || newState();
  history.replaceState({ screen: state.screen, section: state.section }, "", location.href);

  /* The phone's back gesture moves between quiz steps instead of leaving the site. */
  window.addEventListener("popstate", (e) => {
    friendResult = decodeResult(location.hash);
    if (!friendResult) {
      state = load() || newState();
      state.screen = (e.state && e.state.screen) || "intro";
      state.section = e.state && Number.isInteger(e.state.section) ? e.state.section : 0;
      save();
    }
    render({ focus: true });
  });
  render();
})();
