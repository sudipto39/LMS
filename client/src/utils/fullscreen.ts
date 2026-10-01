// src/utils/fullscreen.ts

/**
 * Returns the active fullscreen element, checking both standard and vendor-prefixed properties.
 */
export const getFullscreenElement = (): Element | null => {
  if (typeof document === "undefined") return null;
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  );
};

/**
 * Safely requests fullscreen on the given target element, falling back through vendor prefixes.
 * Returns true if native fullscreen was entered, false otherwise.
 */
export const requestFullscreenSafe = async (
  element: HTMLElement = typeof document !== "undefined" ? document.documentElement : (null as any)
): Promise<boolean> => {
  if (!element) return false;
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return true;
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
      return true;
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
      return true;
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
      return true;
    }
  } catch (err) {
    console.warn("Native fullscreen request rejected/unavailable, falling back to viewport overlay:", err);
  }
  return false;
};

/**
 * Safely exits native fullscreen if active, falling back through vendor prefixes.
 */
export const exitFullscreenSafe = async (): Promise<boolean> => {
  if (typeof document === "undefined") return false;
  try {
    if (getFullscreenElement()) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
        return true;
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
        return true;
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
        return true;
      }
    }
  } catch (err) {
    console.warn("Exit native fullscreen error:", err);
  }
  return false;
};

/**
 * Attaches cross-browser listeners for fullscreen change events.
 */
export const addFullscreenChangeListener = (callback: () => void): (() => void) => {
  if (typeof document === "undefined") return () => {};

  const events = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
  ];

  events.forEach((evt) => document.addEventListener(evt, callback));

  return () => {
    events.forEach((evt) => document.removeEventListener(evt, callback));
  };
};
