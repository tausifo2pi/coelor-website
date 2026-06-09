import Image from "next/image";

export default function Logo({ size = 20 }: { size?: number }) {
  return (
    <Image
      src="/icon-64.png"
      alt="Coelor"
      height={size}
      width={size}
      style={{ objectFit: "contain", display: "block" }}
      priority
    />
  );
}
