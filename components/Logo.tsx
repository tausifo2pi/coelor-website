import Image from "next/image";
import content from "@/data/site-content.json";

/** The Coelor pixel wordmark (SVG, 528×154). `height` in px. */
export default function Logo({ height = 26, className = "", priority = false }: { height?: number; className?: string; priority?: boolean }) {
  const width = Math.round(height * (528 / 154));
  return (
    <Image
      src="/coelor-wordmark.svg?v=7"
      alt={content.brand.name}
      width={width}
      height={height}
      priority={priority}
      className={`block ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
