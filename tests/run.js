/* Run with: node tests/run.js */
const assert = require("assert");
const { CATALOG, PERSONAS, MAX_NAME, analyze, searchSongs, cleanName, versionLabel, encodeResult, decodeResult, isDeep, TOP_N } = require("../js/logic.js");

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

const songs = [...CATALOG.byId.values()];
const inSection = (code) => songs.filter((s) => s.section === code).map((s) => s.id);

function contrast(a, b) {
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b2] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/* Builds results for someone who loves `codes`: up to 5 picks each, ranked in that order. */
function fan(codes, filter = () => true, extra = []) {
  const picks = [];
  for (const code of codes) picks.push(...inSection(code).filter((id) => filter(CATALOG.byId.get(id))).slice(0, 5));
  picks.push(...extra);
  return analyze(picks.slice(0, TOP_N), picks);
}

/* Same fan, but their albums take turns down the ranking, so none of them dominates. */
function evenFan(codes, filter = () => true) {
  const lists = codes.map((code) => inSection(code).filter((id) => filter(CATALOG.byId.get(id))).slice(0, 5));
  const picks = [];
  for (let i = 0; i < 5; i++) for (const list of lists) if (list[i]) picks.push(list[i]);
  return analyze(picks.slice(0, TOP_N), picks);
}

console.log("Song bank");
test("every section has songs and a valid year", () => {
  assert.strictEqual(CATALOG.sections.length, 13);
  for (const s of CATALOG.sections) assert.ok(s.list.length >= 14, s.title);
  for (const s of songs) assert.ok(s.year >= 2006 && s.year <= 2026, s.title);
});
test("no song appears twice", () => {
  const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
  const titles = songs.map((s) => norm(s.title));
  assert.strictEqual(new Set(titles).size, titles.length);
  assert.strictEqual(new Set(songs.map((s) => s.id)).size, songs.length);
});
test("track 5s are in the right slot", () => {
  const expected = {
    de: "Cold as You", fe: "White Horse", sn: "Dear John", re: "All Too Well",
    ne: "All You Had to Do Was Stay", rp: "Delicate", lo: "The Archer", fo: "my tears ricochet",
    ev: "tolerate it", mi: "You're on Your Own, Kid", tt: "So Long, London", sg: "Eldest Daughter",
  };
  for (const [code, title] of Object.entries(expected)) {
    assert.strictEqual(songs.find((s) => s.section === code && s.track === 5).title, title);
  }
});
test("10 minute All Too Well id matches the superlative", () => {
  assert.strictEqual(CATALOG.byId.get("re28").title, "All Too Well (10 Minute Version)");
});
test("non-album songs carry their own year", () => {
  for (const id of inSection("xx")) assert.ok(CATALOG.byId.get(id).year, id);
});

console.log("Design");
test("every theme has readable text (AA)", () => {
  for (const s of CATALOG.sections) {
    const t = s.theme;
    assert.ok(contrast(t.ink, t.bg) >= 7, `${s.title} ink`);
    assert.ok(contrast(t.accentInk, t.accent) >= 4.5, `${s.title} button`);
  }
});

test("muted text and accent marks stay readable on every theme", () => {
  const blend = (fg, bg, alpha) => {
    const channels = (hex) => [16, 8, 0].map((shift) => (parseInt(hex.slice(1), 16) >> shift) & 255);
    const [f, b] = [channels(fg), channels(bg)];
    return `#${f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, "0")).join("")}`;
  };
  for (const s of CATALOG.sections) {
    const t = s.theme;
    assert.ok(contrast(blend(t.ink, t.bg, 0.76), t.bg) >= 4.5, `${s.title} muted`);
    assert.ok(contrast(t.accent, t.bg) >= 3, `${s.title} accent`);
  }
});
test("every section has a results font", () => {
  for (const s of CATALOG.sections) {
    assert.ok(s.font && s.font.display.family && s.font.display.css, s.title);
    assert.strictEqual(analyze(s.list.slice(0, 10).map((x) => x.id), s.list.slice(0, 10).map((x) => x.id)).topAlbum.font, s.font);
  }
});

console.log("Personas");
const cases = [
  ["og", ["de", "fe"]],
  ["scarf", ["sn", "re"]],
  ["pop", ["ne", "lo"]],
  ["cottage", ["fo", "ev"]],
  ["villain", ["rp", "lo", "ne"]],
  ["midnight", ["mi", "lo", "ne"]],
  ["poet", ["tt", "lo", "ne"]],
  ["showgirl", ["sg", "lo", "ne"]],
];
for (const [persona, codes] of cases) {
  test(`${codes.join("+")} fan gets ${persona}`, () => {
    assert.strictEqual(fan(codes).persona.id, persona);
  });
}
test("older albums spread evenly gets OG", () => {
  assert.strictEqual(evenFan(["de", "sn", "fe", "re"]).persona.id, "og");
});
test("recent albums spread evenly gets New Era", () => {
  assert.strictEqual(evenFan(["mi", "tt", "sg"]).persona.id, "newera");
});
test("mostly deep cuts gets Vault Goblin", () => {
  assert.strictEqual(fan(["fe", "re", "sn", "ne", "tt"], isDeep).persona.id, "vault");
});
test("mostly singles gets Aux Cord Diplomat", () => {
  assert.strictEqual(evenFan(["ne", "fo", "re", "mi", "de", "lo"], (s) => s.hit).persona.id, "hits");
});
test("one song from everywhere gets Eras Tourist", () => {
  const order = ["ne", "fo", "de", "mi", "rp", "sn", "ev", "tt", "lo", "re", "sg", "fe"];
  const all = [...order.map((code) => inSection(code)[6]), ...order.map((code) => inSection(code)[7])];
  assert.strictEqual(analyze(all.slice(0, TOP_N), all).persona.id, "tourist");
});

console.log("Scoring");
test("album points add up", () => {
  const result = fan(["fo", "ev", "re"]);
  const total = result.albums.reduce((sum, a) => sum + a.score, 0);
  assert.strictEqual(total, 15 + 55);
  assert.strictEqual(result.topAlbum.code, "fo");
  assert.strictEqual(result.albums.reduce((sum, a) => sum + a.inTop, 0), TOP_N);
});
test("random runs never crash and always give 3 superlatives", () => {
  let seed = 7;
  const rand = (n) => { seed = (seed * 16807) % 2147483647; return seed % n; };
  const seen = new Set();
  for (let run = 0; run < 5000; run++) {
    const picks = new Set();
    for (const s of CATALOG.sections) {
      const howMany = rand(6);
      for (let i = 0; i < howMany; i++) picks.add(s.list[rand(s.list.length)].id);
    }
    const list = [...picks];
    if (list.length < TOP_N) continue;
    for (let i = list.length - 1; i > 0; i--) { const j = rand(i + 1); [list[i], list[j]] = [list[j], list[i]]; }
    const r = analyze(list.slice(0, TOP_N), list);
    assert.ok(PERSONAS[r.persona.id]);
    assert.strictEqual(r.superlatives.length, 3);
    assert.ok(r.avgYear >= 2006 && r.avgYear <= 2026);
    seen.add(r.persona.id);
  }
  assert.ok(seen.has("tourist"));
  console.log(`      personas seen in random runs: ${[...seen].join(", ")}`);
});
test("exactly 10 picks works", () => {
  const ids = inSection("re").slice(0, 10);
  assert.strictEqual(analyze(ids, ids).topSongs.length, 10);
});
test("Ten Minute Club fires for the long All Too Well at #1", () => {
  const ids = ["re28", ...inSection("fo").slice(0, 9)];
  assert.strictEqual(analyze(ids, ids).superlatives[0].name, "Ten Minute Club");
});

console.log("Search");
const firstHit = (query) => (searchSongs(query)[0] || {}).title;
test("forgiving title matches", () => {
  assert.strictEqual(firstHit("anti hero"), "Anti-Hero");
  assert.strictEqual(firstHit("WISH LIST"), "Wi$h Li$t");
  assert.strictEqual(firstHit("thank you aimee"), "thanK you aIMee");
  assert.strictEqual(firstHit("slut"), '"Slut!"');
  assert.strictEqual(firstHit("miss americana and"), "Miss Americana & the Heartbreak Prince");
  assert.strictEqual(firstHit("us"), "us.");
  assert.strictEqual(firstHit("22"), "22");
});
test("exact and starting matches come first", () => {
  assert.strictEqual(firstHit("red"), "Red");
  assert.deepStrictEqual(searchSongs("all too well").map((s) => s.title), ["All Too Well", "All Too Well (10 Minute Version)"]);
});
test("finds featured artists and films", () => {
  assert.ok(searchSongs("ed sheeran").map((s) => s.title).includes("Everything Has Changed"));
  assert.strictEqual(firstHit("toy story"), "I Knew It, I Knew You");
});
test("blank and unmatched searches return nothing", () => {
  assert.deepStrictEqual(searchSongs("   "), []);
  assert.deepStrictEqual(searchSongs("?!"), []);
  assert.deepStrictEqual(searchSongs("zzzzzz"), []);
});

console.log("Share links");
test("results survive the round trip", () => {
  const picks = [...inSection("fo").slice(0, 5), ...inSection("re").slice(0, 5), ...inSection("xx").slice(0, 5)];
  const top = picks.slice(0, 10);
  const decoded = decodeResult(`#${encodeResult(top, picks)}`);
  assert.deepStrictEqual(decoded.top, top);
  assert.deepStrictEqual(new Set(decoded.picks), new Set(picks));
});
test("names survive the round trip, and are optional", () => {
  const ids = inSection("re").slice(0, 10);
  assert.strictEqual(decodeResult(`#${encodeResult(ids, ids)}`).name, "");
  for (const name of ["Vivian", "Zoë & Sam", "Tay #13?", "O'Brien"]) {
    assert.strictEqual(decodeResult(`#${encodeResult(ids, ids, name)}`).name, name);
  }
  assert.strictEqual(decodeResult(`#r=${ids.join(".")}_&n=%E0%A4%A`).name, "");
});
test("version labels", () => {
  assert.strictEqual(versionLabel("Vivian"), "Vivian's Version");
  assert.strictEqual(versionLabel("   "), "My Version");
  assert.strictEqual(versionLabel("", "A Friend's Version"), "A Friend's Version");
  assert.ok(cleanName("x".repeat(99)).length === MAX_NAME);
  assert.strictEqual(cleanName("  a\u0007  b "), "a b");
});
test("bad links are ignored", () => {
  for (const hash of ["", "#", "#r=", "#r=fo1.fo2_", "#r=zz1.zz2.zz3.zz4.zz5.zz6.zz7.zz8.zz9.zz10_", "#<script>"]) {
    assert.strictEqual(decodeResult(hash), null, hash);
  }
  const dup = Array(10).fill("fo1").join(".");
  assert.strictEqual(decodeResult(`#r=${dup}_`), null);
});

console.log(`\n${passed} tests passed, ${songs.length} songs in the bank.`);
