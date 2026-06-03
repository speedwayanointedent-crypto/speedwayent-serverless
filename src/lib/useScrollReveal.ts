"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  opts: { threshold?: number; rootMargin?: string } = {}
) {
  const { threshold = 0.1, rootMargin = "0px" } = opts;
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}

export function useScrollRevealBatch(count: number) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleItems((prev) => {
          const next = new Set(prev);
          entries.forEach((e) => {
            const idx = refs.current.indexOf(e.target as HTMLElement);
            if (idx >= 0 && e.isIntersecting) next.add(idx);
          });
          return next;
        });
      },
      { threshold: 0.1 }
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

  return {
    setRef: (i: number) => (el: HTMLElement | null) => {
      refs.current[i] = el;
    },
    visibleItems,
  };
}
