# CCNYC animated poster research

## Product direction

Replace the weekly request for a community-made poster with a tool that produces a 10–20 second animated poster. The stable identity is CCNYC typography, a consistent hierarchy, restrained palette roles, and event details: date, location, and 6–8pm. Seeded artwork changes each week. Motion is the main creative choice; editable coordinates and unrestricted typography are not the main workflow.

Two Luna research agents examined animation families and export/interaction patterns. A 6.1 Sol implementation agent synthesizes them into the local builder.

## Build first

| Family | Distinctive behavior | Implementation direction |
| --- | --- | --- |
| Flow ribbons | Continuous currents and layered curves | Seed control points and evaluate periodic curves at normalized phase. Avoid accumulating particle history so scrubbing and export remain deterministic. |
| Interference | Two line or ring fields create changing moiré | Animate relative offsets and angles with sine/cosine. Keep line density restrained to avoid flicker. |
| Orbits | Radial geometry, arcs, and circulating marks | Seed ring geometry, use whole-number phase multiples, and reserve quiet space around event text. |
| Kinetic grid | Modular tiles and rhythmic geometric changes | Seed cells and evaluate each from phase; no per-frame randomness or React state updates for drawing. |

Flow, interference, and grid families are a practical starting set. Orbital geometry adds a clearly different composition. Contours are a good later family. True Gray–Scott reaction diffusion is deferred: its evolving simulation does not naturally close into a seamless loop, and GPU feedback adds complexity.

## Shared animation rules

Composition is derived from a seed independently of time. Evaluate one frame from a normalized phase, using periodic functions, so phase zero and one match. A loop duration changes the pace without changing the endpoint. Preview, scrubbing, still export, and video must call the same renderer. Keep text readable on a controlled backing area and use local fonts.

Cap preview resolution and render at 30fps, pause while hidden, and honor reduced motion with an initially paused preview. Precompute seeded geometry. Avoid full-canvas CPU noise/pixel-buffer updates, unnecessary full-resolution blur filters, and a separate perpetual loop per thumbnail.

## Interaction and export

Lead with a large live poster. Offer recognizable visual presets, a few palettes, a Shuffle variation action, clear motion/scale controls, and separate event details. Keep play/pause, timeline, duration, and output size understandable. Make recording progress, cancellation, success, and unsupported-browser errors visible.

Use canvas captureStream plus MediaRecorder only after feature and MIME support detection. Label the format actually generated; do not promise MP4 in every browser. Export a complete cycle based on elapsed time, handle interruption explicitly, release tracks and object URLs, and keep PNG as a still alternative. A video preview/export must include typography and artwork together.

## Primary references

- [The Coding Train: 4D OpenSimplex Noise Loop](https://thecodingtrain.com/challenges/137-4d-opensimplex-noise-loop): sampling time on a circle for periodic organic motion.
- [p5.js noise](https://p5js.org/reference/p5/noise/): coherent noise as an organic field building block.
- [p5.js Bezier](https://p5js.org/reference/p5/bezier/): curve-based flowing and contour geometry.
- [p5.js pixelDensity](https://p5js.org/reference/p5/pixelDensity/): resolution and display-density costs.
- [MDN canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream): canvas video capture API.
- [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder): browser recording and lifecycle.
- [MDN isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static): capability-based codec/container selection.

Pattern selection and product recommendations above are our synthesis of the research, not claims that the sources prescribe this particular UI.

## Expanded library and precise controls

A second pair of Luna agents researched broader geometric families and the recipe/parameter system. The expanded implementation targets twelve real families, each with structural substyles: ribbons, interference, orbit, modular grids, packing, guilloche, clipped cells, contours, halftone, warped checkers, radial rosettes, and constellation geometry. Family names describe different drawing procedures; palette swaps and seeds are not presented as new algorithms.

The practical design space combines family, substyle, composition, density, scale, line weight, symmetry, geometric noise, motion, seed, and editable color roles. Dozens of named starter recipes offer intentional starting points; independently adjustable parameters create many more reproducible combinations. The library should name its actual starter count rather than imply every possible combination was individually art-directed.

Colors are separate roles: paper/background, type ink, and accent colors. Native color pickers and editable HEX fields permit precision. Texture grain is a cached static overlay, separate from geometric noise/warp. Precision controls need finite bounds and meaningful per-family behavior. Loop speed uses whole-cycle multiples or periodic parameter changes so adding motion controls does not break the loop seam.

Saved recipes use a versioned JSON schema with validated colors, bounded numeric values, known enum fields, and length-limited event strings. Local favorites and JSON import/export make a composition reproducible without requiring an account. Controlled randomization respects group locks. Advanced controls are progressively disclosed while the everyday preview-first workflow remains usable.

Additional primary references:

- [p5 randomSeed](https://p5js.org/reference/p5/randomSeed/) and [noiseSeed](https://p5js.org/reference/p5/noiseSeed/): repeatable random sequences and coherent noise.
- [MDN createPattern](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createPattern): reusing offscreen/cached texture sources.
- [MDN compositing](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation): compositing behavior for art layers.
- [Bridson: Fast Poisson Disk Sampling in Arbitrary Dimensions](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf): blue-noise sampling reference for packing/site distribution; an implementation may choose a simpler bounded placement strategy and should label it accurately.
