# Poster studio audit and controls review

October 21, 2026. Scope: all 12built-in families, three mark constructions, three motion behaviors, portrait andStory formats; seeded design and movement, exact inputs, control usability and CCNYC identity.

## Findings addressed

- Coarse low-frequency Contours could disappear inStory. Contour thresholds now adapt to the sampled field range.
- Constellation links popped at a hard distance boundary. Link opacity now tapers to zero before disconnecting.
- Dense Op-art marks had a weight dead zone. A smooth inset formula keeps weight effective.
- Earlier Interference density/scale coupling caused runaway line counts. Density now has independent bounded work and clear count feedback; scale changes wavelength.
- Earlier filled Rosette weight affected an unused stroke. Band boundaries now draw strokes.
- Numeric fields displayed rounded three-decimal values and rotation rounded to integers. Draft text now supports partial decimals/minus signs and arbitrary in-range decimal values. Enter/blur commits, Escape restores; invalid/out-of-range input gives visible feedback. Continuous sliders stay aligned with precise typed values; dragging uses three-decimal values. Seeds and loop cycles intentionally remain integers.
- Design and movement remain together, with persistent section links. Custom coding is a separate top-level workspace with a wider editor. Labels, field help, keyboard focus, HEX labels and phone input sizing reviewed.
- Studio UI now follows ccnyc.space: charcoal#191919, warm ink#e7e5de, muted type, fine rules, monospace navigation and Tanker headings. Exported art keeps independently chosen paper/ink/art colors.

## Evidence and limits

Native Canvas audit:648 configurations,1,944 frames across all families/styles/modes/formats and three profiles (default, dense/extreme, coarse/low-frequency). No exact loop endpoint mismatches or absent sampled movement after fixes.360 sampled pixel comparisons confirm effect of10 controls for each family/mark combination. The audit artifacts remain in the local review workspace. This is sampled coverage, not a claim of no possible bugs. The slowest stress-case native frame was about 103 ms; native timings do not measure browser FPS, and extreme custom/dense artwork can be expensive.

Browser verified exact values including 1.234567 scale and -37.125° rotation and partial draft'.' ->'.625123', preserving full precision and matching slider state. Field range feedback, section navigation, saved user designs and actual custom art exports verified. Existing frame safety regression checks protect subtitle spacing and event information. Production build and 71 poster regression tests pass. Current user Halftone and custom p5 drafts were preserved in browser saves before refreshes.


Color editing uses a persistent preview and a single async render in flight. Rapid edits coalesce into the latest state; grain masks are reused across ink changes. Targeted scheduler regressions cover bursts of edits, disposal and error recovery.
