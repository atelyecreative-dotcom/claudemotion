(async function main() {
  const RENDER = new URLSearchParams(location.search).has('render');
  if (RENDER) document.body.classList.add('render');

  const stage = document.getElementById('stage');
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const svg = document.getElementById('sv');

  await document.fonts.load('700 100px Display');
  await document.fonts.load('600 100px Display');
  await document.fonts.load('500 100px Display');
  await document.fonts.ready;

  const A = await buildAssets();
  const grain = makeGrain();
  const fx = buildFX(svg);
  const txt = new TextLayer(svg, BLOCKS);
  fx.fade = svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: BG, opacity: 0 }, svg);

  function frame(t) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    drawFX(t, ctx, A, txt, fx);
    ctx.drawImage(grain, 0, 0);
    txt.update(t);
  }

  // API usada pelo render.mjs
  window.DURATION = DURATION;
  window.seek = (t) => { frame(t); };
  window.ready = true;
  if (RENDER) return;

  // Pré-visualização em tempo real no navegador
  const fit = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
  };
  addEventListener('resize', fit); fit();
  let playing = true, t = 0, last = performance.now();
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') playing = !playing;
    if (e.code === 'ArrowRight') t = Math.min(DURATION, t + 1);
    if (e.code === 'ArrowLeft') t = Math.max(0, t - 1);
  });
  (function loop(now) {
    if (playing) t = (t + (now - last) / 1000) % DURATION;
    last = now;
    frame(t);
    requestAnimationFrame(loop);
  })(last);
})();
