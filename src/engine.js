// Motor de animação: tudo é função pura do tempo t (segundos),
// então qualquer frame pode ser renderizado isoladamente no headless.
const W = 1080, H = 1920;
const BG = '#f5f5f7', GREY = '#86868b';
const SVGNS = 'http://www.w3.org/2000/svg';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, start, dur) => clamp((t - start) / dur);
const ease = {
  // curva "Apple": arranque rápido, pouso longo e suave
  out: (k) => 1 - Math.pow(1 - k, 4),
  expo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inOut: (k) => (k < 0.5 ? 8 * k * k * k * k : 1 - Math.pow(-2 * k + 2, 4) / 2),
  in: (k) => k * k * k,
};

function svgEl(tag, attrs = {}, parent) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}

// ---------- Tipografia (SVG) ----------
// Cada palavra é um <g> próprio para animar opacidade, deslocamento e blur.
// Marcação inline: *palavra* = ênfase (tinta, bold), ~palavra~ = cor de destaque.
class TextLayer {
  constructor(svg, blocks) {
    this.svg = svg;
    this.words = [];
    this.boxes = {};
    const measure = svgEl('text', { x: -9999, y: -9999 }, svg);
    for (const b of blocks) {
      b.lines.forEach((ln, li) => {
        const size = ln.size, weight = ln.weight || 600;
        const track = ln.track ?? (size >= 80 ? -0.025 : -0.01);
        const raw = ln.text.split(' ');
        const parts = raw.map((w) => {
          let style = 'base', txt = w;
          if (/^\*.*\*[.,:]?$/.test(w)) { style = 'em'; txt = w.replace(/\*/g, ''); }
          if (/^~.*~[.,:]?$/.test(w)) { style = 'accent'; txt = w.replace(/~/g, ''); }
          return { txt, style };
        });
        const sp = size * 0.26;
        const widths = parts.map((p) => {
          measure.setAttribute('font-size', size);
          measure.setAttribute('font-weight', p.style === 'base' ? weight : Math.max(weight, 700));
          measure.setAttribute('letter-spacing', `${track}em`);
          measure.textContent = p.txt;
          return measure.getComputedTextLength();
        });
        const total = widths.reduce((a, b) => a + b, 0) + sp * (parts.length - 1);
        const cx = ln.x ?? W / 2;
        let x = ln.align === 'left' ? cx : cx - total / 2;
        const stagger = ln.stagger ?? 0.11;
        parts.forEach((p, wi) => {
          const g = svgEl('g', {}, svg);
          const color = p.style === 'accent' ? ACCENT : p.style === 'em' ? INK : (ln.color || INK);
          const tx = svgEl('text', {
            x: 0, y: 0, 'font-size': size, fill: color,
            'font-weight': p.style === 'base' ? weight : Math.max(weight, 700),
            'letter-spacing': `${track}em`,
          }, g);
          tx.textContent = p.txt;
          const word = {
            g, x, y: ln.y, size,
            tin: ln.at + wi * stagger,
            tout: (ln.out ?? b.out) + wi * 0.025,
            dim: ln.dim, rise: ln.rise ?? size * 0.35,
          };
          this.words.push(word);
          this.boxes[`${b.id}.${li}.${wi}`] = { x, w: widths[wi], y: ln.y, size };
          x += widths[wi] + sp;
        });
      });
    }
    measure.remove();
  }

  // Caixa (x, w, baseline) cobrindo as palavras a..b de uma linha
  span(block, line, a, b = a) {
    const A = this.boxes[`${block}.${line}.${a}`], B = this.boxes[`${block}.${line}.${b}`];
    return { x: A.x, w: B.x + B.w - A.x, y: A.y, size: A.size };
  }

  update(t) {
    for (const w of this.words) {
      const kin = ease.out(prog(t, w.tin, 0.85));
      const kout = ease.in(prog(t, w.tout, 0.5));
      let op = clamp(prog(t, w.tin, 0.55)) * (1 - kout);
      if (w.dim) op *= lerp(1, w.dim[1], ease.inOut(prog(t, w.dim[0], 0.6)));
      const dy = (1 - kin) * w.rise - kout * w.rise * 0.6;
      const blur = (1 - kin) * 14 + kout * 10;
      const sc = lerp(0.96, 1, kin);
      if (op <= 0.001) { w.g.style.display = 'none'; continue; }
      w.g.style.display = '';
      w.g.setAttribute('transform', `translate(${w.x.toFixed(2)} ${(w.y + dy).toFixed(2)}) scale(${sc.toFixed(4)})`);
      w.g.setAttribute('opacity', op.toFixed(4));
      w.g.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    }
  }
}

// ---------- Pincéis (Canvas 2D) ----------
// Assets são 1200x600 com origem no centro (600, 300).
function drawAsset(ctx, img, x, y, o = {}) {
  const { rot = 0, sx = 1, sy = sx, alpha = 1, reveal = 1, revealArc = null, blur = 0 } = o;
  if (alpha <= 0.001 || reveal <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(sx, sy);
  if (blur > 0.05) ctx.filter = `blur(${blur}px)`;
  if (revealArc !== null) {
    // revelação angular (para círculos desenhados "à mão")
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 700, -Math.PI / 2 - 0.3, -Math.PI / 2 - 0.3 + Math.PI * 2 * revealArc);
    ctx.closePath();
    ctx.clip();
  } else if (reveal < 1) {
    ctx.beginPath();
    ctx.rect(-600, -300, 1200 * reveal, 600);
    ctx.clip();
  }
  ctx.drawImage(img, -600, -300);
  ctx.restore();
}

// Grão de papel sutil, gerado com PRNG fixo (idêntico em todo frame)
function makeGrain() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  let s = 1234567;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 7;
  }
  g.putImageData(img, 0, 0);
  return c;
}
