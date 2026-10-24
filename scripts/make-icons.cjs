// Regenerates the favicon and phone icons from the logo shapes. Run: node scripts/make-icons.cjs (needs the `sharp` package).
const fs = require("fs"); const sharp = require("sharp");
const BARS = [[25, 13], [37.75, 23], [50.5, 49], [63.25, 33], [76, 24]];
const glyph = (bar) => `<g transform="translate(15 0)"><path d="M77.7 35.9 A37.5 37.5 0 1 0 77.7 84.1" fill="none" stroke="#C2501A" stroke-width="11" stroke-linecap="round"/>${BARS.map(([x, h]) => `<rect x="${x}" y="${60 - h / 2}" width="8" height="${h}" rx="4" fill="${bar}"/>`).join("")}</g>`;
const svg = (rx, scale = 1) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="${rx}" fill="#141414"/><g transform="translate(60 60) scale(${scale}) translate(-60 -60)">${glyph("#F7F5F0")}</g></svg>`;
(async () => {
  fs.writeFileSync("app/icon.svg", svg(28));
  const png = (s, out, size) => sharp(Buffer.from(s), { density: 600 }).resize(size, size).png().toFile(out);
  await png(svg(28), "public/icons/icon-192.png", 192);
  await png(svg(28), "public/icons/icon-512.png", 512);
  await png(svg(0, 0.85), "public/icons/maskable-512.png", 512);
  await png(svg(0), "app/apple-icon.png", 180);
  console.log("icons done");
})();
