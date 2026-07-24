"use client";

import { useEffect, useRef } from "react";
import { useReveal } from "@/hooks/useReveal";

type Props = {
  text: string;
  /** trailing words rendered in the serif italic accent style */
  accent?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** ms added before the first word starts */
  delay?: number;
  /** play on mount (above the fold) instead of waiting for scroll */
  immediate?: boolean;
};

const WORD_STAGGER = 45;

function Words({ text, offset, delay, accent = false }: { text: string; offset: number; delay: number; accent?: boolean }) {
  return (
    <>
      {text.split(" ").map((word, i, arr) => (
        <span key={i} aria-hidden>
          <span className="mask-word">
            <span
              className={accent ? "accent-serif" : undefined}
              style={{ "--d": `${delay + (offset + i) * WORD_STAGGER}ms` } as React.CSSProperties}
            >
              {word}
            </span>
          </span>
          {i < arr.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

export default function MaskReveal({ text, accent, as: Tag = "h2", className = "", delay = 0, immediate = false }: Props) {
  const scrollRef = useReveal<HTMLHeadingElement>();
  const immediateRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (!immediate) return;
    const el = immediateRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => el.classList.add("is-in"));
    return () => cancelAnimationFrame(raf);
  }, [immediate]);

  const plainCount = text.split(" ").length;

  return (
    <Tag
      ref={immediate ? immediateRef : scrollRef}
      className={`mask-reveal ${className}`}
      aria-label={accent ? `${text} ${accent}` : text}
    >
      <Words text={text} offset={0} delay={delay} />
      {accent ? (
        <>
          {" "}
          <Words text={accent} offset={plainCount} delay={delay} accent />
        </>
      ) : null}
    </Tag>
  );
}
