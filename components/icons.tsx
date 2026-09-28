import type { ComponentType } from "react";
import {
  Copy,
  PackageX,
  FileSpreadsheet,
  GitCompareArrows,
  BellOff,
  RefreshCw,
  ArrowRightLeft,
  Link2,
  CalendarClock,
  Receipt,
  ShieldCheck,
  PhoneCall,
  Wrench,
  Power,
  Activity,
  Check,
  Plus,
  ArrowRight,
  Warehouse,
  Store,
  Pencil,
  Keyboard,
  PackagePlus,
  Undo2,
  Pause,
  TriangleAlert,
  Tag,
  ShoppingBag,
  Globe,
  type LucideProps,
} from "lucide-react";


const LUCIDE: Record<string, ComponentType<LucideProps>> = {
  copy: Copy,
  "package-x": PackageX,
  "file-spreadsheet": FileSpreadsheet,
  "git-compare": GitCompareArrows,
  "bell-off": BellOff,
  refresh: RefreshCw,
  route: ArrowRightLeft,
  link: Link2,
  "calendar-clock": CalendarClock,
  receipt: Receipt,
  shield: ShieldCheck,
  phone: PhoneCall,
  wrench: Wrench,
  power: Power,
  activity: Activity,
  check: Check,
  plus: Plus,
  "arrow-right": ArrowRight,
  warehouse: Warehouse,
  store: Store,
  pencil: Pencil,
  keyboard: Keyboard,
  "package-plus": PackagePlus,
  undo: Undo2,
  pause: Pause,
  alert: TriangleAlert,
  tag: Tag,
  bag: ShoppingBag,
  globe: Globe,
};

/** UI icon by name (Lucide). Unknown names render nothing. */
export function Icon({ name, size = 20, className = "", strokeWidth = 1.8 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = LUCIDE[name];
  if (!C) return null;
  return <C size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}
