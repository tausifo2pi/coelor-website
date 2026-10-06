import Logo from "@/components/Logo";
import { Icon } from "@/components/icons";
import { PREFILL } from "@/lib/offer";

// The case study's header (logo home, "Book a call" to the form below). No live demo link: email readers only.
// Not the homepage Navbar: its links are homepage anchors.
export default function PricingHeader() {
  return (
    <header className="sticky top-0 z-[60] border-b border-rule bg-[rgba(10,12,16,0.82)] backdrop-blur-[14px]">
      <div className="mx-auto flex h-[68px] max-w-site items-center justify-between px-5 md:h-[76px] md:px-10 lg:px-20">
        <a href="/" aria-label="Coelor home" className="flex items-center py-2">
          <Logo height={26} priority className="md:hidden" />
          <Logo height={32} priority className="hidden md:block" />
        </a>
        <div className="flex items-center gap-5">
          <a href="#contact" data-prefill={PREFILL.trial} className="hidden text-[15px] font-medium text-ink-muted transition-colors hover:text-ink sm:inline">
            Free trial
          </a>
          <a
            href="#contact"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-rule-strong bg-white/10 px-[18px] text-[15px] font-medium text-ink transition-colors hover:bg-white/15"
          >
            Book a call
            <Icon name="arrow-right" size={14} strokeWidth={2.4} />
          </a>
        </div>
      </div>
    </header>
  );
}
