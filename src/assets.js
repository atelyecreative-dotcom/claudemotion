// Pré-renderiza os traços de pincel (p5.brush) uma única vez.
// Cada asset vira um <canvas> 2D que a cena compõe quadro a quadro,
// garantindo textura idêntica em todos os frames (render determinístico).
window.INK = '#1d1d1f';
window.ACCENT = '#e5484d';

window.buildAssets = function () {
  return new Promise((resolve) => {
    const W = 1200, H = 600;
    const jobs = [];
    const assets = {};

    // Flecha horizontal apontando para a direita, centrada no canvas.
    // Ponta em (len/2, 0). Retorna o comprimento útil.
    function arrow(color, seed) {
      return () => {
        P.randomSeed(seed); P.noiseSeed(seed);
        const L = 760, x0 = -L / 2, x1 = L / 2;
        brush.noField();
        // haste
        brush.set('2B', color, 2.6);
        brush.line(x0 + 30, 0, x1 - 6, 0);
        brush.set('charcoal', color, 1.4);
        brush.line(x0 + 40, 1, x1 - 20, -1);
        // ponta
        brush.noStroke();
        brush.wash(color, 255);
        brush.polygon([[x1 + 10, 0], [x1 - 70, -32], [x1 - 54, 0], [x1 - 70, 32]]);
        brush.noWash();
        brush.set('2B', color, 2);
        brush.line(x1 + 10, 0, x1 - 70, -32);
        brush.line(x1 + 10, 0, x1 - 70, 32);
        // penas
        brush.set('2B', color, 2.4);
        for (let i = 0; i < 3; i++) {
          const fx = x0 + 30 + i * 22;
          brush.line(fx, 0, fx - 44, -38);
          brush.line(fx, 0, fx - 44, 38);
        }
      };
    }

    jobs.push(['arrow1', arrow(INK, 11)]);
    jobs.push(['arrow2', arrow(ACCENT, 23)]);

    // Alvo: círculo à mão + núcleo
    jobs.push(['target', () => {
      P.randomSeed(5); P.noiseSeed(5);
      brush.set('2B', INK, 2.4);
      brush.noFill();
      brush.circle(0, 0, 210, 0.08);
      brush.set('HB', INK, 1.2);
      brush.circle(0, 0, 212, 0.05);
      brush.set('HB', INK, 1.6);
      brush.circle(0, 0, 120, 0.08);
      brush.noStroke();
      brush.wash(INK, 255);
      brush.circle(0, 0, 30, 0.1);
      brush.noWash();
    }]);

    // Sublinhado de marcador
    function underline(color, seed) {
      return () => {
        P.randomSeed(seed); P.noiseSeed(seed);
        brush.set('2B', color, 5);
        brush.spline([[-500, 6], [-150, -2], [200, 3], [500, -6]], 0.5);
        brush.set('charcoal', color, 3);
        brush.spline([[-490, 9], [-150, 2], [200, 6], [495, -2]], 0.5);
      };
    }
    jobs.push(['underline', underline(INK, 3)]);
    jobs.push(['underlineAccent', underline(ACCENT, 7)]);

    // Círculo de destaque ao redor de um número
    jobs.push(['ring', () => {
      P.randomSeed(9); P.noiseSeed(9);
      brush.set('2B', INK, 3.4);
      brush.noFill();
      brush.circle(0, 0, 250, 0.25);
      brush.set('HB', INK, 1.6);
      brush.circle(4, -3, 246, 0.25);
    }]);

    // X de bloqueio
    jobs.push(['slash', () => {
      P.randomSeed(13); P.noiseSeed(13);
      brush.set('2B', INK, 7);
      brush.line(-220, 0, 220, 2);
      brush.set('charcoal', INK, 4);
      brush.line(-215, 3, 218, -1);
    }]);

    let i = 0, P;
    new p5((p) => {
      P = p;
      brush.instance(p);
      p.setup = () => {
        p.pixelDensity(1);
        p.createCanvas(W, H, p.WEBGL);
        brush.scaleBrushes(1.6);
        p.noLoop();
        p.clear();
        p.redraw();
      };
      p.draw = () => {
        // draw() é chamado uma vez por asset; capturamos o anterior no início.
        if (i > 0) {
          const c = document.createElement('canvas');
          c.width = W; c.height = H;
          c.getContext('2d').drawImage(p.canvas, 0, 0);
          assets[jobs[i - 1][0]] = c;
        }
        if (i >= jobs.length) { p.canvas.remove(); resolve(assets); return; }
        p.clear();
        jobs[i][1]();
        i++;
        setTimeout(() => p.redraw(), 0);
      };
    }, document.getElementById('p5host'));
  });
};
