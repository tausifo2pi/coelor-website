/** Numbered eyebrow + headline + optional body, shared by every section below the hero. */
export default function SectionHead({
  id,
  num,
  eyebrow,
  headline,
  body,
  className = "",
  size = "lg",
}: {
  id: string;
  num: string;
  eyebrow: string;
  headline: string;
  body?: string;
  className?: string;
  size?: "lg" | "md";
}) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <span className="inline-flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.08em] text-accent">
        <span className="text-ink-soft">{num}</span>
        <span className="h-px w-6 bg-accent/50" aria-hidden />
        {eyebrow}
      </span>
      <h2 id={id} className={`h2 text-ink ${size === "lg" ? "text-[32px] md:text-[40px] lg:text-[44px]" : "text-[28px] md:text-[34px] lg:text-[38px]"}`}>
        {headline}
      </h2>
      {body && <p className="max-w-[560px] text-[15px] leading-[1.6] text-ink-muted md:text-[17px]">{body}</p>}
    </div>
  );
}
