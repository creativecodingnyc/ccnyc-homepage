/** Coalesce edits into the latest frame, allowing only one async render in flight. */
export function createLatestPainter(draw: () => Promise<void>, onError: (error: unknown) => void = () => {}) {
  let dirty = false, frame = 0, drawing = false, disposed = false;
  function request() {
    if (disposed) return;
    dirty = true;
    if (frame || drawing) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      dirty = false;
      drawing = true;
      void Promise.resolve().then(draw).catch(onError).finally(() => {
        drawing = false;
        if (dirty && !disposed) request();
      });
    });
  }
  return {
    request,
    dispose() { disposed = true; dirty = false; cancelAnimationFrame(frame); frame = 0; },
  };
}
