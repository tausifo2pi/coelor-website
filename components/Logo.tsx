import Image from "next/image";

export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <Image
      src="/coelor-logo.png"
      alt="Coelor"
      height={size}
      width={size * 4}
      style={{ objectFit: "contain", display: "block" }}
      priority
    />
  );
}
