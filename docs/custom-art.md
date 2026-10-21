# Custom artwork workspace

Open `/build-a-poster#code-controls` or choose Custom code beside Design and Event. The editor has its own wider workspace and shares the current poster preview. Run is explicit; failed code does not replace the last successful program. Draft text survives switching tabs. Successfully run source is included in saved/exported recipes. Save before reloading to preserve the applied source; unapplied editor drafts are not recipe state.

## Frame contract

Artwork is clipped to the existing middle region. The Tanker/Karla CCNYC lockup and event footer are always composed by the shared renderer afterward. PNG and MP4/WebM use the same composition. Shader/sketch source does not receive access to the parent document or its storage. Each program runs in an iframe with only allow-scripts; no allow-same-origin. The sandbox CSP disables connections, forms and general external assets. A source-checked message bridge transfers ImageBitmap frames and closes them after copying. Renderers own timeouts and explicit cleanup; export cancellation also disposes the renderer.

GLSL supports WebGL 1 fragment shaders; the starter declares the supplied uniforms. u_resolution is vec2. Time, phase, seed, numeric shape/motion settings are floats. Paper, ink and three art colors are RGB vec3. See editor Frame API for names. Compile/link errors are displayed. p5 uses the real locally hosted p5.js 1.11.11 in instance mode: optional setup(p, frame), required draw(p, frame). The runtime creates/resizes the canvas, seeds randomness/noise and owns playback; p is a normal p5 instance.

frame.phase/u_phase is normalized 0–1 and follows speed, direction and Still. Use periodic sine/cosine of phase to make seamless, seekable artwork. frame.time/u_time is the corresponding cycle time in seconds. Canvas dimensions, seed, colors and numeric controls are available to code; code must reference the controls it wants to use. Stateful simulations can depend on history and may not match a seeked frame or a fresh export. Network media and arbitrary external libraries are unavailable. Source limit is 50,000 characters and recipe imports are capped at 512 KB.

Selecting a built-in family returns to built-in artwork while preserving custom source. The Custom code workspace also offers Use built-in family. All edit/runtime work stays local; code is not uploaded.

## Verification

Browser-tested both starter languages, p5 draw error, GLSL compile error, preservation of last working art, code draft retention across tabs, one active sandbox with allow-scripts only, actual p5 PNG at 1080×1920, and GLSL H264 MP4 at 1080×1920 lasting 15.000167 seconds. Seventy-one poster regression tests and production build pass. Custom code is arbitrary user work, so sampled starter/validation checks do not guarantee every submitted program is fast or seamless.
