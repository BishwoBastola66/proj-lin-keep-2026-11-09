"use client";

import { useEffect } from "react";

/**
 * Prevents:
 * 1. Accidental trackpad pinch-zoom and Ctrl+wheel zoom
 * 2. Keyboard zoom shortcuts (Ctrl/Cmd + '+', '-', '0')
 * 3. Mobile / touch pinch-to-zoom
 * 4. Browser history navigation swipe gestures
 */
export default function PreventZoomAndNavigation() {
  useEffect(() => {
    // Prevent trackpad pinch zoom & Ctrl + mousewheel zoom
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Prevent Ctrl/Cmd + / - / 0 keyboard zoom
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "+" ||
          e.key === "-" ||
          e.key === "=" ||
          e.key === "_" ||
          e.key === "0" ||
          e.key === "NumpadAdd" ||
          e.key === "NumpadSubtract")
      ) {
        e.preventDefault();
      }
    };

    // Prevent gesture zoom (WebKit / Safari / Chrome gestures)
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // Prevent multi-touch pinch zoom
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    document.addEventListener("gesturestart", handleGesture as EventListener, {
      passive: false,
    });
    document.addEventListener("gesturechange", handleGesture as EventListener, {
      passive: false,
    });
    document.addEventListener("gestureend", handleGesture as EventListener, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener(
        "gesturestart",
        handleGesture as EventListener
      );
      document.removeEventListener(
        "gesturechange",
        handleGesture as EventListener
      );
      document.removeEventListener(
        "gestureend",
        handleGesture as EventListener
      );
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return null;
}
