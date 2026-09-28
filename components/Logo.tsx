/** The Coelor pixel wordmark (SVG, 528×154). `height` in px. A plain <img>: an SVG gains nothing from next/image, which
 * would add its client script to every page. */
export default function Logo({ height = 26, className = "", priority = false }: { height?: number; className?: string; priority?: boolean }) {
  const width = Math.round(height * (528 / 154));
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/coelor-wordmark.svg?v=7"
      alt="Coelor"
      width={width}
      height={height}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`block ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
