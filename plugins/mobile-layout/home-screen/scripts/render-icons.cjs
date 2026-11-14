// Render the black/white DeepSeek whale home-screen PNGs from DSH's favicon path.
// usage: node render-icons.cjs <DSH favicon.svg> <out dir>  (needs Playwright + Chrome); copy the PNGs into ../assets
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const [src, out] = process.argv.slice(2);
  const d = /\sd="([^"]+)"/.exec(fs.readFileSync(src, 'utf8'))[1];
  const B = { x: 1.0, y: 7.0, w: 48.3425, h: 36.3161 };
  const svg = (bg, fg, frac) => {
    const s = frac * 100 / B.w, tx = (100 - B.w * s) / 2 - B.x * s, ty = (100 - B.h * s) / 2 - B.y * s;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/><path fill="${fg}" transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${s.toFixed(4)})" d="${d}"/></svg>`;
  };
  const files = [['apple-touch-icon', 180, 0.70], ['icon-192', 192, 0.70], ['icon-512', 512, 0.70], ['icon-maskable-512', 512, 0.62]];
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [variant, bg, fg] of [['black', '#000', '#fff'], ['white', '#fff', '#000']]) {
    for (const [name, size, frac] of files) {
      const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
      await p.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg(bg, fg, frac)}`);
      await p.screenshot({ path: path.join(out, `${variant}-${name}.png`), clip: { x: 0, y: 0, width: size, height: size } });
      await p.close();
    }
  }
  await b.close();
})();
