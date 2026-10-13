/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  // Older outreach emails link the case study by its first address; the page no longer names a vertical (2026-10-14).
  async redirects() {
    return [{ source: "/case-studies/sneakers", destination: "/case-studies/stock-sync", permanent: true }];
  },
};

export default nextConfig;
