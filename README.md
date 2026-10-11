# Duas Flechas — motion design minimalista

Vídeo vertical (1080×1920, 30 fps, ~46 s) em tipografia cinética estilo Apple, sobre a ideia de Epicteto e a analogia das duas flechas.

**Stack:** HTML + **SVG** (tipografia) + **Canvas 2D** (composição) + **p5.brush** (traços de pincel: flechas, alvo, sublinhados, X) → renderizado quadro a quadro no **Chromium headless** (Playwright) → **ffmpeg** (H.264).

## Uso

```bash
npm install
npm run render                 # → out/duas-flechas.mp4
node render.mjs --fps 60       # 60 fps
node render.mjs --still 5,28.7 # frames avulsos em out/ para revisar
```

Pré-visualização ao vivo: sirva a pasta (`npx serve .`) e abra `index.html` — espaço pausa, ←/→ pula 1 s.
Fora deste ambiente, aponte o Chromium com `CHROME_PATH=/caminho/do/chrome`.

## Estrutura

| Arquivo | Papel |
|---|---|
| `src/timeline.js` | **Roteiro e tempos** — edite aqui textos, posições e momentos de entrada/saída |
| `src/assets.js` | Traços de pincel gerados com p5.brush (seed fixa → idênticos em todo frame) |
| `src/engine.js` | Animação de palavras (fade + subida + blur), composição dos pincéis, grão de papel |
| `render.mjs` | Render determinístico frame a frame + ffmpeg |

Marcação nos textos da timeline: `*palavra*` = ênfase em negrito, `~palavra~` = cor de destaque (vermelho).

## Mapa de tempos (para gravar/encaixar a locução)

| Tempo | Fala |
|---|---|
| 0,3 – 3,7 | Você sofre pelo que acontece. |
| 4,1 – 9,3 | Porém sofre muito mais pelo que pensa sobre o que aconteceu. |
| 9,8 – 12,9 | Eu vi isso numa frase do Epicteto… |
| 13,3 – 20,3 | …não são as coisas que nos perturbam, e sim o julgamento que fazemos delas. |
| 20,8 – 23,3 | E tem uma analogia que vai te fazer entender melhor isso… |
| 23,8 – 26,9 | Pensa em 2 flechas. |
| 27,5 – 32,7 | A primeira flecha é a dor inevitável da vida (impacto em 28,6 s). |
| 33,1 – 38,3 | A segunda é o sofrimento que a mente adiciona de forma interpretativa (impacto em 34,2 s). |
| 38,7 – 46,0 | O objetivo é reconhecer e impedir a segunda flecha. |

Para sincronizar com um áudio gravado: ajuste os `at`/`out` em `src/timeline.js` e depois junte o áudio:
`ffmpeg -i out/duas-flechas.mp4 -i voz.m4a -c:v copy -c:a aac -shortest out/final.mp4`
