"use client";

import { type CSSProperties, useLayoutEffect, useState } from "react";

// Alto máximo para que el bloque termine en el borde inferior de la pantalla y su contenido haga scroll adentro.
// Solo desde minWidth (null lo apaga): en pantallas chicas devuelve sin límite y la página hace el scroll.
export function useFitViewport<T extends HTMLElement>(minWidth: number | null = 1024, bottom = 40) {
  const [el, ref] = useState<T | null>(null);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    if (!el || minWidth === null) return undefined;
    const wide = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      setMaxHeight(wide.matches ? Math.max(280, Math.floor(window.innerHeight - top - bottom)) : undefined);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener("resize", update);
    wide.addEventListener("change", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      wide.removeEventListener("change", update);
    };
  }, [el, minWidth, bottom]);

  const style: CSSProperties | undefined = maxHeight === undefined || minWidth === null ? undefined : { maxHeight };
  return { ref, style };
}
