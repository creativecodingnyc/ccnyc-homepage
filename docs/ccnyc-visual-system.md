# CCNYC poster identity

The identity comes from a stable typographic frame and a changing generative artwork. Each weekly poster is reproducible through its seed and complete recipe.

- CCNYC leads in the existing Tanker face. The full name stays beneath it in Karla. Protect the clear space below this lockup; animation and texture cannot enter it.
- Art owns the middle field. Pick one family and develop its geometry through seed, scale, density, mark construction, weight and spatial distortion. A seed changes structure; a palette change should not change geometry.
- Event details stay still and readable: date, venue, time. The fixed footer keeps information usable while the background evolves. Avoid extra slogans competing with the artwork.
- Five color roles: paper, type and three art colors. Curated palettes are starting points; all roles accept exact HEX values. Keep paper/type contrast sufficient for small event copy.
- Motion is part of the composition: travel controls spatial paths; deformation changes the forms; intensity scales both. Integer cycles make repeatable loops. Still is an explicit choice.
- Portrait4:5 and Story9:16 share uniform typography and protected header/footer zones. Preview and exports use the same renderer.
- Save or export the recipe with the final poster. Reuse the type frame across weekly outputs while varying the seed, geometry and motion deliberately.

Implementation: src/lib/poster-renderer.ts owns the output identity. Studio UI styling is separate from poster colors. See custom-art.md for the custom rendering and export API.
