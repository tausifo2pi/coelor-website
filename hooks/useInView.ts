"use client";

import { useEffect, useRef, useState } from "react";

export function useInView<T extends Element>(options: IntersectionObserverInit = { threshold: 0.3 }, once = true) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (once) observer.disconnect();
      } else if (!once) {
        setInView(false);
      }
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
  }, [options, once]);

  return { ref, inView };
}
