/* Song catalog, scoring, personas and superlatives. No DOM, so tests can run it in Node. */
(function (root) {
  const SECTIONS = typeof module !== "undefined" ? require("./data.js") : root.TS_SECTIONS;

  const MAX_PER_SECTION = 7;
  const TOP_N = 10;
  const RANK_POINTS = (TOP_N * (TOP_N + 1)) / 2;

  function parseSong(entry, section, position, kind, group, track) {
    const [title, ...flags] = entry.split("|");
    const song = {
      id: section.code + position,
      title,
      section: section.code,
      track,
      group: group || null,
      kind: kind || "album",
      year: section.year,
      hit: false,
      vault: false,
      tag: null,
      feat: null,
      note: null,
    };
    for (const flag of flags) {
      const [key, value] = flag.split("=");
      if (key === "hit") song.hit = true;
      else if (key === "vault") song.vault = true;
      else if (key === "y") song.year = Number(value);
      else if (key === "tag" || key === "feat" || key === "note") song[key] = value;
      else throw new Error(`Unknown flag "${key}" on ${title}`);
    }
    return song;
  }

  function buildCatalog() {
    const byId = new Map();
    const sections = SECTIONS.map((section) => {
      const out = { ...section, list: [] };
      let position = 0;
      const add = (entry, kind, group, track) => {
        const song = parseSong(entry, section, position++, kind, group, track);
        byId.set(song.id, song);
        out.list.push(song);
      };
      if (section.songs) section.songs.forEach((entry, i) => add(entry, "album", null, i + 1));
      else section.groups.forEach((g) => g.songs.forEach((entry) => add(entry, g.kind, g.name, null)));
      return out;
    });
    return { sections, byId };
  }

  const CATALOG = buildCatalog();
  const sectionOf = (song) => CATALOG.sections.find((s) => s.code === song.section);

  /* A song off the main tracklist that wasn't a single counts as a deep cut. */
  const isDeep = (song) => !song.hit && (song.vault || !!song.tag || song.kind !== "album");

  /* 1 point for making your shortlist, plus 10 for #1 down to 1 for #10. */
  function scoreOf(id, top) {
    const rank = top.indexOf(id);
    return 1 + (rank === -1 ? 0 : TOP_N - rank);
  }

  const PERSONAS = {
    og: {
      name: "The OG",
      line: "You were here before the stadiums, and you'd like that on the record.",
      roast:
        "You discovered her on a country station and have been insufferable about it since. Your favorites come with a sundress, a pickup truck and a lecture about what real fans know. New listeners fear you. Old listeners are also a bit tired.",
    },
    scarf: {
      name: "The Scarf Custodian",
      line: "Autumn is a personality and you have it year-round.",
      roast:
        "You have cried to a ten-minute song on purpose, in a car, while parked. You treat heartbreak as a seasonal hobby and your love of a slow-building bridge has ended friendships. Somebody please check on you in October.",
    },
    pop: {
      name: "The Stadium Screamer",
      line: "If a chorus can't fill an arena, you don't want to hear it.",
      roast:
        "You like your feelings glossy, synth-heavy and at full volume. You've done the choreography in a kitchen, a Target and at least one wedding. People say you only like the big songs, and you can't hear them over the big songs.",
    },
    villain: {
      name: "The Villain Era Lifer",
      line: "The snakes were never a phase for you.",
      roast:
        "You saw an album about reputation damage and said 'finally, a lifestyle.' You own too much black, you hold grudges in alphabetical order, and you've described a minor email as an act of war. Honestly, it's working for you.",
    },
    cottage: {
      name: "The Cardigan Cryptid",
      line: "Rarely seen in daylight. Usually near a lake.",
      roast:
        "You call these albums 'the good ones' in front of people who didn't ask. You've gone on a walk to process a song about fictional teenagers, and you now own a candle that smells like a forest you've never visited. Your bestie is a narrative device.",
    },
    midnight: {
      name: "The 3am Overthinker",
      line: "You're awake. You're replaying a conversation from 2019.",
      roast:
        "Your love language is lying in bed and running the numbers on something you said at a party. You think in plot twists, you have a theory about everyone, and you're pretty sure the problem might be you. It might be.",
    },
    poet: {
      name: "The Tenured Tortured Professor",
      line: "You've read the whole syllabus, including the extra 15 songs.",
      roast:
        "You made it through a two-hour album and came back with notes. You can defend a clunky line as 'actually genius' for 40 minutes without a slide deck. You are not fine, but you are extremely well-read about it.",
    },
    showgirl: {
      name: "The Sequin Loyalist",
      line: "If it's new and it sparkles, you're already in line.",
      roast:
        "You live firmly in the present tense. You had the theories, the merch and the release-night listening party, and you'll tell anyone that this is her best work, as you've done with every album. Your optimism is either inspiring or a medical condition.",
    },
    vault: {
      name: "The Vault Goblin",
      line: "You don't have favorites. You have finds.",
      roast:
        "You skipped the singles on principle and went straight to the bonus tracks, the deluxe editions and the songs nobody else knows the words to. You've said 'oh, you probably haven't heard it' out loud. You were right, and it didn't help.",
    },
    hits: {
      name: "The Aux Cord Diplomat",
      line: "Everybody in the car is happy, and that's your whole deal.",
      roast:
        "You love the songs everyone loves, and you refuse to apologize. While others argue about track 14 of a deluxe edition, you're having a great time. You may be the only well-adjusted person here, which is a little suspicious.",
    },
    newera: {
      name: "The New Era Apologist",
      line: "The past is lovely. You just don't live there.",
      roast:
        "Your top songs are young enough to still have a release-week playlist. Someone mentioned 2008 and you nodded politely, as if they'd brought up the Roman Empire. You'll get to the old stuff eventually. You've been saying so for a while.",
    },
    tourist: {
      name: "The Eras Tourist",
      line: "One song from every stop. You've seen the whole map.",
      roast:
        "Ask you to pick a favorite era and you'll look at the floor. You have a little of everything, a strong opinion about nothing, and the emotional range of a very good shuffle. Critics call it indecisive. You call it a balanced diet.",
    },
  };

  /* Single-album personas have a lower bar than two-album ones, but that album must also clearly lead. */
  const GROUPS = [
    { persona: "og", sections: ["de", "fe"], min: 0.4 },
    { persona: "scarf", sections: ["sn", "re"], min: 0.4 },
    { persona: "pop", sections: ["ne", "lo"], min: 0.4 },
    { persona: "cottage", sections: ["fo", "ev"], min: 0.4 },
    { persona: "villain", sections: ["rp"], min: 0.3 },
    { persona: "midnight", sections: ["mi"], min: 0.3 },
    { persona: "poet", sections: ["tt"], min: 0.3 },
    { persona: "showgirl", sections: ["sg"], min: 0.3 },
  ];
  const OLD = ["de", "fe", "sn", "re"];
  const NEW = ["mi", "tt", "sg"];

  function choosePersona(shares, deepShare, hitShare) {
    if (deepShare >= 0.5) return "vault";
    const sum = (codes) => codes.reduce((total, code) => total + (shares[code] || 0), 0);
    const leads = (code) =>
      Object.entries(shares).every(([other, share]) => other === code || shares[code] >= share * 1.3);
    const qualifying = GROUPS.map((g) => ({ ...g, share: sum(g.sections) }))
      .filter((g) => g.share >= g.min && (g.sections.length > 1 || leads(g.sections[0])))
      .sort((a, b) => b.share / b.min - a.share / a.min);
    if (qualifying.length) return qualifying[0].persona;
    if (hitShare >= 0.7) return "hits";
    if (sum(OLD) >= 0.5) return "og";
    if (sum(NEW) >= 0.5) return "newera";
    return "tourist";
  }

  /* Listed strongest first. Results show the first three that apply. */
  const SUPERLATIVES = [
    { name: "Ten Minute Club", blurb: "You put the long one at #1. Bold of you to assume anyone has the time.", test: (c) => c.topSongs[0].id === "re28" },
    { name: "Track 5 Truther", blurb: "You went for the saddest slot on the tracklist again and again. Are you okay?", test: (c) => c.track5s >= 4 },
    { name: "Holiday Menace", blurb: "A Christmas song in your favorites. Your family has asked you to stop in July.", test: (c) => c.picks.some((s) => s.kind === "holiday") },
    { name: "Soundtrack Supervisor", blurb: "You've sat through the credits to hear the one song. Twice.", test: (c) => c.picks.filter((s) => s.kind === "soundtrack").length >= 3 },
    { name: "Vault Raider", blurb: "Most likely to say 'it should have been on the album' at a party.", test: (c) => c.picks.filter((s) => s.vault).length >= 6 },
    { name: "Feature Creature", blurb: "You love a duet. Everyone should bring a friend, apparently.", test: (c) => c.picks.filter((s) => s.feat).length >= 6 },
    { name: "One Album Wonder", blurb: "Four or more of your top 10 share an album. Nobody's surprised.", test: (c) => c.maxInTop >= 4 },
    { name: "Commitment Issues", blurb: "Your top 10 spans at least seven albums. You can't settle down.", test: (c) => c.albumsInTop >= 7 },
    { name: "Certified Time Traveler", blurb: "More than 15 years between your oldest and newest favorites. You contain multitudes.", test: (c) => c.span >= 15 },
    { name: "Deep Cut Dweller", blurb: "Not a single single in your top 10. Very cool. Nobody asked.", test: (c) => c.topSongs.every((s) => !s.hit) },
    { name: "Radio's Favorite Child", blurb: "At least eight singles in your top 10. You've simply got ears.", test: (c) => c.topSongs.filter((s) => s.hit).length >= 8 },
    { name: "Day One Energy", blurb: "Your #1 is from her first two albums. You've been waiting to tell someone.", test: (c) => ["de", "fe"].includes(c.topSongs[0].section) },
    { name: "Recency Bias", blurb: "Your #1 came out in the last few years. Enjoy it while it's new.", test: (c) => c.topSongs[0].year >= 2024 },
    { name: "Survived the Cut", blurb: "You narrowed nearly 300 songs to 10 and didn't throw your phone.", test: () => true },
    { name: "Certified Listener", blurb: "You have ears, opinions and a ranked list. That's more than most.", test: () => true },
    { name: "Would Absolutely Reshuffle", blurb: "Ask again tomorrow and this list changes. We all know it.", test: () => true },
  ];

  function analyze(topIds, pickIds) {
    const ids = [...new Set([...topIds, ...pickIds])];
    const picks = ids.map((id) => CATALOG.byId.get(id));
    const topSongs = topIds.map((id) => CATALOG.byId.get(id));
    const total = ids.reduce((sum, id) => sum + scoreOf(id, topIds), 0);

    const albums = CATALOG.sections
      .map((section) => {
        const mine = ids.filter((id) => CATALOG.byId.get(id).section === section.code);
        const score = mine.reduce((sum, id) => sum + scoreOf(id, topIds), 0);
        return {
          code: section.code,
          title: section.title,
          short: section.short,
          theme: section.theme,
          font: section.font,
          order: CATALOG.sections.indexOf(section),
          picks: mine.length,
          inTop: mine.filter((id) => topIds.includes(id)).length,
          score,
          share: total ? score / total : 0,
        };
      })
      .sort((a, b) => b.score - a.score || a.order - b.order);

    /* Personas lean on the ranking, so filling more pages doesn't water down someone's taste. */
    const blendedShare = (test) => {
      const matching = (id) => test(CATALOG.byId.get(id));
      const rankPoints = topIds.reduce((sum, id) => sum + (matching(id) ? scoreOf(id, topIds) - 1 : 0), 0);
      return 0.7 * (rankPoints / RANK_POINTS) + 0.3 * (ids.filter(matching).length / ids.length);
    };
    const shares = Object.fromEntries(albums.map((a) => [a.code, blendedShare((s) => s.section === a.code)]));
    const deepShare = blendedShare(isDeep);
    const hitShare = blendedShare((s) => s.hit);

    const persona = choosePersona(shares, deepShare, hitShare);

    const years = topSongs.map((s) => s.year);
    const weightedYear =
      ids.reduce((sum, id) => sum + CATALOG.byId.get(id).year * scoreOf(id, topIds), 0) / total;

    const context = {
      picks,
      topSongs,
      track5s: picks.filter((s) => s.track === 5).length,
      maxInTop: Math.max(...albums.map((a) => a.inTop)),
      albumsInTop: albums.filter((a) => a.inTop > 0).length,
      span: Math.max(...years) - Math.min(...years),
    };

    return {
      persona: { id: persona, ...PERSONAS[persona] },
      albums,
      topAlbum: albums[0],
      secondAlbum: albums[1].score > 0 ? albums[1] : null,
      streak: albums[1].score > 0
        ? `Mostly ${albums[0].short}, with a ${albums[1].short} streak.`
        : `All ${albums[0].short}, all the time.`,
      topSongs,
      picks,
      avgYear: Math.round(weightedYear),
      albumsRepresented: albums.filter((a) => a.picks > 0).length,
      superlatives: SUPERLATIVES.filter((s) => s.test(context)).slice(0, 3),
    };
  }

  /* Forgiving match: ignores case, accents, spaces and punctuation, so "anti hero" and "wish list" work. */
  const compact = (text) =>
    String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/\$/g, "s").replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

  /* Searches titles, featured artists and film names. Title matches come first, best match on top. */
  function searchSongs(query) {
    const q = compact(query);
    if (!q) return [];
    const rank = (song) => {
      const title = compact(song.title);
      if (title === q) return 0;
      if (title.startsWith(q)) return 1;
      if (title.includes(q)) return 2;
      return compact(`${song.feat || ""} ${song.note || ""}`).includes(q) ? 3 : -1;
    };
    return [...CATALOG.byId.values()]
      .map((song, i) => ({ song, i, r: rank(song) }))
      .filter((m) => m.r >= 0)
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map((m) => m.song);
  }

  /* Share links hold the song ids and optional name, so a friend's results need no server. */
  const MAX_NAME = 24;
  const cleanName = (name) =>
    String(name || "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME).trim();

  const versionLabel = (name, fallback = "My Version") => {
    const clean = cleanName(name);
    return clean ? `${clean}'s Version` : fallback;
  };

  function encodeResult(topIds, pickIds, name) {
    const rest = pickIds.filter((id) => !topIds.includes(id));
    const clean = cleanName(name);
    return `r=${topIds.join(".")}_${rest.join(".")}${clean ? `&n=${encodeURIComponent(clean)}` : ""}`;
  }

  function decodeResult(hash) {
    const match = /^#?r=([a-z0-9.]+)_([a-z0-9.]*)(?:&n=([^&]*))?$/.exec(hash || "");
    if (!match) return null;
    const known = (list) => list.split(".").filter((id) => CATALOG.byId.has(id));
    const top = [...new Set(known(match[1]))];
    if (top.length !== TOP_N) return null;
    let name = "";
    try { name = cleanName(decodeURIComponent(match[3] || "")); } catch (e) { /* bad name, ignore it */ }
    return { top, picks: [...new Set([...top, ...known(match[2])])], name };
  }

  const api = {
    CATALOG, MAX_PER_SECTION, TOP_N, MAX_NAME, PERSONAS, SUPERLATIVES,
    sectionOf, isDeep, analyze, searchSongs, cleanName, versionLabel, encodeResult, decodeResult,
  };
  root.TS = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
