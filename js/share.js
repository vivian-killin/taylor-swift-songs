/* Draws the 1080x1350 share cards from a results object: top 10, album breakdown, superlatives. */
(function (root) {
  const W = 1080;
  const H = 1350;
  const M = 72;
  const SYSTEM = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  function wrap(ctx, text, maxWidth) {
    const lines = [];
    let line = "";
    for (const word of text.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function ellipsize(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let cut = text;
    while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
    return `${cut.trimEnd()}…`;
  }

  function displayFont(spec, size) {
    const style = spec.italic ? "italic " : "";
    return `${style}${spec.weight} ${Math.round(size * spec.scale)}px "${spec.family}", ${spec.sans ? SYSTEM : "Georgia, serif"}`;
  }

  /* Shrinks text until it fits in maxLines, and returns the lines and the size used. */
  function fit(ctx, text, spec, startSize, minSize, maxWidth, maxLines) {
    let size = startSize;
    let lines;
    for (;;) {
      ctx.font = displayFont(spec, size);
      lines = wrap(ctx, spec.upper ? text.toUpperCase() : text, maxWidth);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if ((lines.length <= maxLines && widest <= maxWidth) || size <= minSize) break;
      size -= 2;
    }
    return { lines: lines.slice(0, maxLines).map((l) => ellipsize(ctx, l, maxWidth)), size };
  }

  function sparkle(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const radius = i % 2 ? r * 0.22 : r;
      const angle = (Math.PI / 4) * i - Math.PI / 2;
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* A friendship bracelet: letter beads between colored album beads, on a sagging string. */
  function bracelet(ctx, word, y, theme, albums) {
    const upper = word.toUpperCase();
    const letters = [...(upper.length > 12 ? upper.split(" ")[0] : upper)].slice(0, 12);
    const colors = albums.map((a) => a.theme.bg);
    const beadR = 25;
    const step = beadR * 2 + 3;
    const count = Math.floor((W - M * 2) / step);
    const start = Math.floor((count - letters.length) / 2);
    const left = (W - (count - 1) * step) / 2;
    const yAt = (x) => y + 16 * (1 - ((x - W / 2) / (W / 2)) ** 2);

    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 37; x <= W - 37; x += 20) ctx.lineTo(x, yAt(x));
    ctx.lineTo(W - 37, yAt(W - 37));
    ctx.stroke();

    for (let i = 0; i < count; i++) {
      const x = left + i * step;
      const by = yAt(x);
      const letter = letters[i - start];
      ctx.beginPath();
      ctx.arc(x, by, beadR, 0, Math.PI * 2);
      ctx.fillStyle = letter !== undefined ? "#FFFDF7" : colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = theme.ink;
      ctx.stroke();
      if (letter && letter !== " ") {
        ctx.fillStyle = "#1E1A22";
        ctx.font = `800 28px ${SYSTEM}`;
        ctx.textAlign = "center";
        ctx.fillText(letter, x, by + 10);
        ctx.textAlign = "left";
      }
    }
  }

  function divider(ctx, y, theme) {
    ctx.strokeStyle = theme.ink;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(M + 8, y);
    ctx.lineTo(W - M - 8, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  /* Persona name under the "my taste" label. Returns the new y. */
  function drawPersona(ctx, result, y, theme, display, textFamily, contentW) {
    y += 56;
    ctx.fillStyle = theme.ink;
    ctx.font = `700 26px ${textFamily}`;
    ctx.globalAlpha = 0.85;
    ctx.fillText("MY TASTE SAYS I'M", M + 8, y);
    ctx.globalAlpha = 1;
    const personaFit = fit(ctx, result.persona.name, display, 62, 38, contentW, 2);
    ctx.font = displayFont(display, personaFit.size);
    ctx.fillStyle = theme.accent;
    for (const line of personaFit.lines) {
      y += personaFit.size * display.scale * 1.12;
      ctx.fillText(line, M + 8, y);
    }
    return y;
  }

  function drawTop10(ctx, result, y, bottom, env) {
    const { theme, display, textFamily, contentW } = env;
    y = drawPersona(ctx, result, y, theme, display, textFamily, contentW) + 22;
    divider(ctx, y, theme);
    const rowH = Math.min(74, (bottom - y - 6) / 10);
    result.topSongs.forEach((song, i) => {
      const base = y + rowH * (i + 1) - rowH * 0.22;
      ctx.fillStyle = theme.accent;
      ctx.font = `800 ${Math.round(Math.min(rowH * 0.62, 42))}px ${textFamily}`;
      ctx.textAlign = "right";
      ctx.fillText(String(i + 1), M + 58, base);
      ctx.textAlign = "left";
      ctx.fillStyle = theme.ink;
      ctx.font = `600 ${Math.round(Math.min(rowH * 0.58, 40))}px ${textFamily}`;
      ctx.fillText(ellipsize(ctx, song.title, W - M * 2 - 90), M + 78, base);
    });
  }

  function drawAlbums(ctx, result, y, bottom, env) {
    const { theme, textFamily, contentW } = env;
    y += 54;
    ctx.fillStyle = theme.ink;
    ctx.font = `600 34px ${textFamily}`;
    for (const line of wrap(ctx, result.streak, contentW)) {
      ctx.fillText(line, M + 8, y);
      y += 44;
    }
    y -= 14;
    divider(ctx, y, theme);
    const albums = result.albums.filter((a) => a.score > 0);
    const top = albums[0].score;
    const rowH = Math.min(96, (bottom - y - 10) / albums.length);
    const nameSize = Math.round(Math.min(rowH * 0.42, 36));
    const barH = Math.max(8, Math.round(Math.min(rowH * 0.17, 16)));
    const left = M + 8;
    const right = W - M - 8;
    albums.forEach((album, i) => {
      const rowTop = y + 8 + rowH * i;
      const base = rowTop + rowH * 0.52;
      const swatchR = nameSize * 0.36;
      ctx.beginPath();
      ctx.arc(left + swatchR, base - nameSize * 0.34, swatchR, 0, Math.PI * 2);
      ctx.fillStyle = album.theme.bg;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.ink;
      ctx.stroke();

      ctx.fillStyle = theme.ink;
      ctx.font = `700 ${nameSize}px ${textFamily}`;
      ctx.fillText(album.short, left + swatchR * 2 + 12, base);
      ctx.font = `500 ${Math.round(nameSize * 0.8)}px ${textFamily}`;
      ctx.globalAlpha = 0.85;
      ctx.textAlign = "right";
      ctx.fillText(`${album.score} pts · ${album.inTop} in top 10`, right, base);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;

      const barY = base + rowH * 0.11;
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = theme.ink;
      roundedRect(ctx, left, barY, right - left, barH, barH / 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = theme.accent;
      roundedRect(ctx, left, barY, Math.max(barH, (right - left) * (album.score / top)), barH, barH / 2);
      ctx.fill();
    });
  }

  function drawSuperlatives(ctx, result, y, bottom, env) {
    const { theme, display, textFamily, contentW } = env;
    y = drawPersona(ctx, result, y, theme, display, textFamily, contentW) + 44;
    ctx.fillStyle = theme.ink;
    ctx.font = `italic 500 32px ${textFamily}`;
    for (const line of wrap(ctx, result.persona.line, contentW).slice(0, 2)) {
      ctx.fillText(line, M + 8, y);
      y += 42;
    }
    y -= 6;
    const gap = 16;
    const count = result.superlatives.length;
    const boxH = Math.min(240, (bottom - y - gap * (count - 1)) / count);
    const boxW = W - (M + 8) * 2;
    result.superlatives.forEach((item, i) => {
      const boxY = y + (boxH + gap) * i;
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = theme.ink;
      roundedRect(ctx, M + 8, boxY, boxW, boxH, 22);
      ctx.fill();
      ctx.globalAlpha = 1;
      /* IM Fell's numbers are hard to read, so "Track 5" uses the text font there. */
      const nameSpec = display.oldstyleDigits && /\d/.test(item.name)
        ? { ...display, family: env.textFamilyName, oldstyleDigits: false }
        : display;
      const nameFit = fit(ctx, item.name, nameSpec, 46, 28, boxW - 56, 1);
      ctx.font = displayFont(nameSpec, nameFit.size);
      ctx.fillStyle = theme.accent;
      const nameBase = boxY + 28 + nameFit.size * display.scale * 0.9;
      ctx.fillText(nameFit.lines[0], M + 36, nameBase);
      ctx.fillStyle = theme.ink;
      ctx.font = `500 36px ${textFamily}`;
      const lines = wrap(ctx, item.blurb, boxW - 56);
      const room = Math.max(1, Math.floor((boxY + boxH - 14 - nameBase) / 46));
      lines.slice(0, room).forEach((line, j) => {
        const text = j === room - 1 && lines.length > room ? ellipsize(ctx, `${line} ${lines[j + 1]}`, boxW - 56) : line;
        ctx.fillText(text, M + 36, nameBase + 48 + j * 46);
      });
    });
  }

  const CARD_TYPES = {
    top10: { kicker: "Top 10 Taylor Swift Songs:", title: (clean) => root.TS.versionLabel(clean), draw: drawTop10 },
    albums: { kicker: "Top 10 Taylor Swift Songs", title: (clean) => `${clean ? `${clean}'s` : "My"} Album Breakdown`, draw: drawAlbums },
    superlatives: { kicker: "Top 10 Taylor Swift Songs", title: (clean) => `${clean ? `${clean}'s` : "My"} Superlatives`, draw: drawSuperlatives },
  };

  async function drawShareImage(result, { name, site, kind = "top10" }) {
    const { theme, font } = result.topAlbum;
    const display = font.display;
    const textFamily = font.text ? `"${font.text.family}", Georgia, serif` : SYSTEM;
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load(displayFont(display, 40), "Top 10 Taylor"),
        font.text ? document.fonts.load(`400 40px "${font.text.family}"`) : null,
        font.text ? document.fonts.load(`italic 400 40px "${font.text.family}"`) : null,
      ]).catch(() => {});
    }

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    /* Double border, like a ticket stub. */
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, W - 52, H - 52);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    sparkle(ctx, W - 118, 112, 34, theme.accent);
    sparkle(ctx, W - 170, 160, 15, theme.ink);
    sparkle(ctx, W - 92, 186, 11, theme.accent);

    const card = CARD_TYPES[kind];
    const contentW = W - M * 2 - 16;
    const clean = root.TS.cleanName(name);
    let y = 104;
    ctx.fillStyle = theme.ink;
    ctx.font = `700 30px ${textFamily}`;
    ctx.fillText(card.kicker, M + 8, y);

    const titleFit = fit(ctx, card.title(clean), display, kind === "top10" ? 92 : 68, 46, contentW - 110, 2);
    ctx.font = displayFont(display, titleFit.size);
    for (const line of titleFit.lines) {
      y += titleFit.size * display.scale * 1.08;
      ctx.fillText(line, M + 8, y);
    }

    card.draw(ctx, result, y, H - 190, { theme, display, textFamily, textFamilyName: font.text ? font.text.family : "", contentW });

    bracelet(ctx, clean || "TOP 10", H - 158, theme, result.albums.filter((a) => a.code !== result.topAlbum.code).slice(0, 5));

    ctx.fillStyle = theme.ink;
    ctx.textAlign = "center";
    ctx.font = `700 28px ${textFamily}`;
    ctx.fillText(ellipsize(ctx, `Make yours: ${site}`, W - M * 2), W / 2, H - 66);
    ctx.textAlign = "left";

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  root.drawShareImage = drawShareImage;
})(window);
