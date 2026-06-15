import { RefObject, useCallback, useEffect, useState } from 'react';

// Vendor-prefixed surfaces (Safari/old WebKit) the standard typings omit.
type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

/**
 * Native Fullscreen API bound to a target element, with a WebKit fallback.
 *
 * `isFullscreen` tracks whether THIS element is the fullscreen element (not just
 * any), so a button can flip its icon. `toggle()` must be called from a user
 * gesture (the browser requires it) — wiring it to an onClick satisfies that.
 */
export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const doc = document as FsDocument;
    const onChange = () => {
      const fsEl = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setIsFullscreen(!!fsEl && fsEl === targetRef.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, [targetRef]);

  const toggle = useCallback(() => {
    const el = targetRef.current as FsElement | null;
    if (!el) return;
    const doc = document as FsDocument;
    const fsEl = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
    if (fsEl) {
      (document.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document);
    } else {
      (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
    }
  }, [targetRef]);

  return { isFullscreen, toggle };
}
