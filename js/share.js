/* Draws the 1080x1350 share image from a results object. */
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

  async function drawShareImage(result, { name, site }) {
    const { theme, font } = result.topAlbum;
    const display = font.display;
    const textFamily = font.text ? `"${font.text.family}", Georgia, serif` : SYSTEM;
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load(displayFont(display, 40), "Top 10 Taylor"),
        font.text ? document.fonts.load(`400 40px "${font.text.family}"`) : null,
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

    const contentW = W - M * 2 - 16;
    let y = 104;
    ctx.fillStyle = theme.ink;
    ctx.font = `700 30px ${textFamily}`;
    ctx.fillText("Top 10 Taylor Swift Songs:", M + 8, y);

    const clean = root.TS.cleanName(name);
    const version = root.TS.versionLabel(clean);
    const titleFit = fit(ctx, version, display, 92, 50, contentW - 110, 2);
    ctx.font = displayFont(display, titleFit.size);
    for (const line of titleFit.lines) {
      y += titleFit.size * display.scale * 1.08;
      ctx.fillText(line, M + 8, y);
    }

    y += 56;
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

    y += 22;
    ctx.strokeStyle = theme.ink;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(M + 8, y);
    ctx.lineTo(W - M - 8, y);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const footerTop = H - 190;
    const rowH = Math.min(74, (footerTop - y - 6) / 10);
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
