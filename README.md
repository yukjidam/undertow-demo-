# Undertow

A single-page interactive portfolio: a WebGL shader background, a "hold to
cross" dimension portal, a scattered project field, generative canvas art,
and a generative jazz engine that goes underwater when you're on the other
side.

Check live demo: https://undertow-ecru.vercel.app

## Structure

```
undertow/
├── index.html      markup only
├── css/
│   └── styles.css  all styling
└── js/
    └── script.js   all behavior + the two GLSL shader sources
                     (stored as string constants, VS_SRC / FS_SRC)
```

No build step, no dependencies, no package manager. It's plain HTML/CSS/JS
plus one WebGL fragment shader and the Web Audio API.

## Running it

Because `index.html` loads `css/styles.css` and `js/script.js` via relative
paths, opening the file directly in a browser works in most cases, but some
browsers restrict certain APIs (like the AudioContext) on the `file://`
protocol. The safest route is a static server from inside the `undertow/`
folder:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then open `http://localhost:8000`.

## Controls

- **Hold** (mouse or touch) anywhere to open the portal. Hold to full charge
  and it **latches** — you stay on the other side until you click again or
  press `Esc`.
- **Space** — same as holding, for keyboard users.
- **G** — toggle the layout grid overlay.
- **M** — toggle the generative jazz score.
- **R** — reshuffle the scattered project field.
- **Arrow keys** — step through projects when a project panel is open.

## Where things live in `script.js`

- `PROJECTS`, `LAB` — content data for the work field and lab rail.
- `Art` — the generative flow-field renderer used for thumbnails, lab
  cards, and the project panel hero.
- Portal / pointer state — the `P` object and the render loop's portal math.
- `mkAudio`, `vo`, `bass`, `ride`, `rhodes`, `schedule` — the jazz engine
  (walking bass, swung ride, sparse comping, improvised melody over an
  eight-bar chord progression).
- The underwater effect lives in the render loop, where `AU.wet`, `AU.lp`,
  `AU.hs`, and `AU.wow` are driven by the portal's `ease` value.
- `VS_SRC` / `FS_SRC` — the vertex and fragment shader source for the
  WebGL background.
