// Roteiro → timeline. Tempos em segundos; ajuste aqui para casar com a locução.
const DURATION = 46;

const BLOCKS = [
  { id: 'a', out: 3.7, lines: [
    { text: 'Você sofre', size: 128, weight: 700, y: 900, at: 0.3 },
    { text: 'pelo que acontece.', size: 72, weight: 500, color: GREY, y: 1010, at: 1.3 },
  ] },
  { id: 'b', out: 9.3, lines: [
    { text: 'Porém,', size: 60, weight: 500, color: GREY, y: 760, at: 4.1 },
    { text: 'sofre muito mais', size: 120, weight: 700, y: 900, at: 4.5, stagger: 0.13 },
    { text: 'pelo que *pensa*', size: 72, weight: 500, color: GREY, y: 1080, at: 6.6 },
    { text: 'sobre o que aconteceu.', size: 72, weight: 500, color: GREY, y: 1170, at: 7.3 },
  ] },
  { id: 'c', out: 12.9, lines: [
    { text: 'FILÓSOFO ESTOICO', size: 34, weight: 600, color: GREY, y: 830, at: 9.8, track: 0.25, stagger: 0.05 },
    { text: 'Epicteto', size: 170, weight: 700, y: 1000, at: 10.05 },
    { text: 'c. 50 – 135 d.C.', size: 40, weight: 500, color: GREY, y: 1110, at: 10.7, stagger: 0.05 },
  ] },
  { id: 'd', out: 20.3, lines: [
    { text: '“', size: 300, weight: 700, color: '#d2d2d7', y: 800, at: 13.3 },
    { text: 'Não são as coisas', size: 84, weight: 600, y: 880, at: 13.6, dim: [16.1, 0.28] },
    { text: 'que nos perturbam,', size: 84, weight: 600, y: 980, at: 14.4, dim: [16.1, 0.28] },
    { text: 'e sim o julgamento', size: 84, weight: 600, y: 1140, at: 16.2 },
    { text: 'que fazemos delas.', size: 84, weight: 600, y: 1240, at: 17.0 },
    { text: '— Epicteto', size: 40, weight: 500, color: GREY, y: 1380, at: 18.2 },
  ] },
  { id: 'e', out: 23.3, lines: [
    { text: 'E tem uma analogia', size: 88, weight: 700, y: 910, at: 20.8 },
    { text: 'que vai te fazer entender melhor.', size: 54, weight: 500, color: GREY, y: 1020, at: 21.6, stagger: 0.07 },
  ] },
  { id: 'f', out: 26.9, lines: [
    { text: 'Pensa em', size: 72, weight: 500, color: GREY, y: 640, at: 23.8 },
    { text: '2', size: 440, weight: 700, y: 1120, at: 24.2 },
    { text: 'flechas', size: 96, weight: 700, y: 1420, at: 24.9 },
  ] },
  { id: 'g', out: 32.7, lines: [
    { text: 'A PRIMEIRA FLECHA', size: 34, weight: 600, color: GREY, y: 470, at: 27.5, track: 0.25, stagger: 0.05 },
    { text: 'a dor inevitável', size: 96, weight: 700, y: 600, at: 28.7 },
    { text: 'da vida.', size: 96, weight: 700, y: 710, at: 29.1 },
  ] },
  { id: 'h', out: 38.3, lines: [
    { text: '~A~ ~SEGUNDA~ ~FLECHA~', size: 34, weight: 600, y: 470, at: 33.1, track: 0.25, stagger: 0.05 },
    { text: 'o sofrimento que', size: 96, weight: 700, y: 600, at: 34.3 },
    { text: 'a mente adiciona,', size: 96, weight: 700, y: 710, at: 34.7 },
    { text: 'de forma interpretativa.', size: 52, weight: 500, color: GREY, y: 800, at: 35.6, stagger: 0.07 },
  ] },
  { id: 'i', out: 44.6, lines: [
    { text: 'O OBJETIVO', size: 34, weight: 600, color: GREY, y: 470, at: 38.7, track: 0.25, stagger: 0.05 },
    { text: 'reconhecer', size: 96, weight: 700, y: 600, at: 39.3 },
    { text: 'e impedir a', size: 96, weight: 700, y: 710, at: 40.4 },
    { text: '~segunda~ ~flecha.~', size: 96, weight: 700, y: 820, at: 40.8 },
  ] },
];

// ---------- Cena das flechas ----------
const TX = 690, TY = 1200;          // centro do alvo
const AS = 0.7;                     // escala das flechas
const TIP = 390;                    // ponta da flecha no espaço do asset
const ARROWS = {
  a1: { img: 'arrow1', hit: 28.6, tip: [TX - 34, TY - 14], rot: 0.2 },
  a2: { img: 'arrow2', hit: 34.2, tip: [TX - 24, TY + 18], rot: -0.27 },
};
const FLIGHT = 0.5, DIST = 1500;

// k ∈ [0,1]: progresso ao longo da trajetória (1 = cravada no alvo)
function arrowCenter(a, k) {
  const c = Math.cos(a.rot), s = Math.sin(a.rot);
  const back = (1 - k) * DIST + TIP * AS;
  return [a.tip[0] - c * back, a.tip[1] - s * back];
}

function flightK(a, t) {
  const p = prog(t, a.hit - FLIGHT, FLIGHT);
  return p * p * 0.35 + p * 0.65; // acelera levemente até o impacto
}

function wobble(a, t) {
  const d = t - a.hit;
  return d > 0 ? 0.04 * Math.sin(d * 34) * Math.exp(-d * 6) : 0;
}

function drawArrow(ctx, A, a, t, k, extra = {}) {
  if (t < a.hit - FLIGHT) return;
  const rot = a.rot + (extra.noWobble ? 0 : wobble(a, t));
  const [x, y] = arrowCenter(a, k);
  const alpha = extra.alpha ?? 1;
  // rastro de movimento enquanto voa
  if (k < 1 && !extra.noTrail) {
    for (let i = 4; i >= 1; i--) {
      const [gx, gy] = arrowCenter(a, Math.max(0, k - i * 0.035));
      drawAsset(ctx, A[a.img], gx, gy, { rot, sx: AS, alpha: alpha * 0.1, blur: 3 });
    }
  }
  drawAsset(ctx, A[a.img], x, y + (extra.dy || 0), { rot, sx: AS, alpha, blur: extra.blur || 0 });
}

// Efeitos de canvas + SVG que não são texto
function drawFX(t, ctx, A, txt, fx) {
  // sublinhado em "muito mais"
  {
    const s = txt.span('b', 1, 1, 2);
    const k = ease.inOut(prog(t, 5.3, 0.7));
    const out = 1 - ease.in(prog(t, 9.3, 0.5));
    drawAsset(ctx, A.underline, s.x + s.w / 2, s.y + 32, { sx: (s.w / 1000) * 1.06, sy: 1.4, reveal: k, alpha: out });
  }
  // sublinhado em "julgamento"
  {
    const s = txt.span('d', 3, 3);
    const k = ease.inOut(prog(t, 16.9, 0.6));
    const out = 1 - ease.in(prog(t, 20.3, 0.5));
    drawAsset(ctx, A.underlineAccent, s.x + s.w / 2, s.y + 24, { sx: (s.w / 1000) * 1.08, sy: 1.3, reveal: k, alpha: out });
  }
  // círculo ao redor do "2"
  {
    const s = txt.span('f', 1, 0);
    const k = ease.inOut(prog(t, 24.6, 0.9));
    const out = 1 - ease.in(prog(t, 26.9, 0.5));
    if (k > 0) drawAsset(ctx, A.ring, s.x + s.w / 2, s.y - 158, { sx: 0.95, revealArc: k, alpha: out });
  }

  // alvo
  const tIn = ease.out(prog(t, 27.3, 1.0));
  let shake = 0;
  for (const a of [ARROWS.a1, ARROWS.a2]) {
    const d = t - a.hit;
    if (d > 0) shake += 7 * Math.sin(d * 42) * Math.exp(-d * 9);
  }
  const endFade = 1 - ease.inOut(prog(t, 44.8, 1.0));
  drawAsset(ctx, A.target, TX + shake, TY, { sx: lerp(0.9, 1, tIn), alpha: tIn * endFade, blur: (1 - tIn) * 10 });

  // 1ª flecha
  const a1 = ARROWS.a1;
  drawArrow(ctx, A, a1, t, flightK(a1, t), { alpha: endFade });

  // 2ª flecha: crava, é reconhecida, recua e é bloqueada
  const a2 = ARROWS.a2;
  const back = ease.inOut(prog(t, 40.4, 0.8));
  const k2 = t < 40.4 ? flightK(a2, t) : lerp(1, 0.8, back);
  const gone = ease.in(prog(t, 42.5, 0.8));
  drawArrow(ctx, A, a2, t, k2, {
    alpha: 1 - gone, dy: gone * 40, blur: gone * 6, noTrail: t > 40.4, noWobble: t > 40.4,
  });

  // elipse de "reconhecer" ao redor da 2ª flecha
  {
    const [cx, cy] = arrowCenter(a2, k2);
    const k = ease.inOut(prog(t, 39.4, 0.8));
    const out = 1 - ease.out(prog(t, 40.3, 0.4));
    if (k > 0) drawAsset(ctx, A.ring, cx, cy, { rot: a2.rot, sx: 1.25, sy: 0.32, revealArc: k, alpha: out });
  }
  // X na ponta da 2ª flecha: ela é barrada antes de chegar
  {
    const [ax, ay] = arrowCenter(a2, k2);
    const cx = ax + Math.cos(a2.rot) * TIP * AS - 20, cy = ay + Math.sin(a2.rot) * TIP * AS;
    const k1 = ease.inOut(prog(t, 41.2, 0.3));
    const k2b = ease.inOut(prog(t, 41.45, 0.3));
    const o = { sx: 0.5, alpha: 1 - gone, blur: gone * 6 };
    drawAsset(ctx, A.slash, cx + 20, cy + gone * 40, { ...o, rot: Math.PI / 4, reveal: k1 });
    drawAsset(ctx, A.slash, cx + 20, cy + gone * 40, { ...o, rot: -Math.PI / 4, reveal: k2b });
  }

  // ondas de impacto + traço sob "Epicteto" + fade final (SVG)
  [[fx.r1, a1, INK], [fx.r2, a2, ACCENT]].forEach(([el, a, col]) => {
    const p = prog(t, a.hit, 0.9);
    const show = p > 0 && p < 1;
    el.setAttribute('opacity', show ? (0.55 * (1 - ease.out(p))).toFixed(3) : 0);
    el.setAttribute('r', (20 + 200 * ease.out(p)).toFixed(2));
    el.setAttribute('cx', a.tip[0]); el.setAttribute('cy', a.tip[1]);
    el.setAttribute('stroke', col);
  });
  {
    const k = ease.out(prog(t, 10.6, 0.9));
    const out = 1 - ease.in(prog(t, 12.9, 0.5));
    fx.rule.setAttribute('x1', W / 2 - 150 * k);
    fx.rule.setAttribute('x2', W / 2 + 150 * k);
    fx.rule.setAttribute('opacity', (k * out).toFixed(3));
  }
  fx.fade.setAttribute('opacity', ease.inOut(prog(t, 45.0, 1.0)).toFixed(3));
}

function buildFX(svg) {
  const fx = {};
  fx.r1 = svgEl('circle', { fill: 'none', 'stroke-width': 3, opacity: 0 }, svg);
  fx.r2 = svgEl('circle', { fill: 'none', 'stroke-width': 3, opacity: 0 }, svg);
  fx.rule = svgEl('line', { y1: 1050, y2: 1050, stroke: '#d2d2d7', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, svg);
  return fx;
}
