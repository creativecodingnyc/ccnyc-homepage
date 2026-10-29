export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const attributes: WebGLContextAttributes = {
      failIfMajorPerformanceCaveat: true,
      powerPreference: "low-power",
    };

    const context = window.WebGLRenderingContext && (
      canvas.getContext("webgl2", attributes) ||
      canvas.getContext("webgl", attributes) ||
      canvas.getContext("experimental-webgl", attributes)
    ) as WebGLRenderingContext | null;
    // only a probe: release the context so it does not count against the page's limit
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}
