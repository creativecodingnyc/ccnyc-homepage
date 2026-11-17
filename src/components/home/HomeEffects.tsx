"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { reportClientError } from "@/components/ClientObservability";
import { supportsWebGL } from "@/lib/webgl-support";

function activateStaticHomepage() {
  // Let the effects engine settle its own state when it is available. The DOM
  // fallback below is intentionally independent so an import failure cannot
  // leave the page hidden behind the loader.
  window.dispatchEvent(new Event("home-effects-fallback"));
  if (document.documentElement.classList.contains("webgl-fallback")) return;

  document.documentElement.classList.add("webgl-fallback");
  document.getElementById("map")?.remove();
  document.querySelector("canvas.p5Canvas")?.remove();
  document.getElementById("board")?.classList.add("on");
  document.getElementById("topbar")?.classList.add("on");
  document.getElementById("sub")?.classList.add("on");
  document
    .querySelectorAll<HTMLElement>(".ph")
    .forEach((photo) => photo.classList.add("out", "landed"));
  const shot = document.getElementById("shot");
  if (shot) shot.style.opacity = "1";
  const skipButton = document.getElementById("skipIntro");
  const hadFocus = document.activeElement === skipButton;
  if (skipButton) skipButton.hidden = true;
  if (hadFocus)
    requestAnimationFrame(() => document.getElementById("menuBtn")?.focus());
}

export default function HomeEffects() {
  const [effectsState, setEffectsState] = useState<
    "loading" | "ready" | "failed"
  >("loading");
  const [webGLSupported, setWebGLSupported] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);

  useEffect(() => {
    let disposed = false;
    let effectsInitialized = false;
    let forceStatic = false;
    let cleanup: (() => void) | undefined;
    const skipController = new AbortController();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const navigatorWithMemory = navigator as Navigator & {
      deviceMemory?: number;
    };
    const lowPowerMode =
      window.matchMedia("(max-width: 768px)").matches ||
      (navigator.hardwareConcurrency > 0 &&
        navigator.hardwareConcurrency <= 4) ||
      (navigatorWithMemory.deviceMemory !== undefined &&
        navigatorWithMemory.deviceMemory <= 4);
    const skipButton = document.getElementById("skipIntro");
    const updatePageVisibility = () => setPageVisible(!document.hidden);
    updatePageVisibility();
    document.addEventListener("visibilitychange", updatePageVisibility, {
      signal: skipController.signal,
    });
    skipButton?.addEventListener(
      "click",
      () => {
        if (effectsInitialized) {
          window.dispatchEvent(new Event("home-effects-skip"));
          return;
        }
        forceStatic = true;
        activateStaticHomepage();
        setWebGLSupported(false);
        setEffectsState("failed");
      },
      { signal: skipController.signal },
    );

    if (reducedMotion) {
      forceStatic = true;
      activateStaticHomepage();
    }

    void import("@/lib/home-effects")
      .then(({ initializeHomeEffects }) => {
        if (disposed) return;
        const supported = !forceStatic && supportsWebGL();
        cleanup = initializeHomeEffects({
          webGLSupported: supported,
          lowPowerMode,
        });
        effectsInitialized = true;
        setWebGLSupported(supported);
        setEffectsState(supported ? "ready" : "failed");
      })
      .catch((error: unknown) => {
        if (disposed) return;
        console.error("Could not initialize the homepage effects.", error);
        reportClientError(error, { kind: "home-effects-initialization" });
        forceStatic = true;
        activateStaticHomepage();
        setEffectsState("failed");
      });

    return () => {
      disposed = true;
      skipController.abort();
      cleanup?.();
    };
  }, []);

  if (effectsState !== "ready" || !webGLSupported || !pageVisible) return null;

  return (
    <Script
      src="/vendor/p5.min.js"
      strategy="afterInteractive"
      onError={(event) => {
        console.error("Could not load p5; using the static homepage.", event);
        reportClientError(new Error("Could not load p5"), {
          kind: "p5-script-load",
        });
        activateStaticHomepage();
      }}
    />
  );
}
