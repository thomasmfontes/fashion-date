import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/termos",
        destination: "/#termos",
        permanent: false,
      },
      {
        source: "/privacidade",
        destination: "/#privacidade",
        permanent: false,
      },
      {
        source: "/termos-de-uso",
        destination: "/#termos",
        permanent: false,
      },
      {
        source: "/politica-de-privacidade",
        destination: "/#privacidade",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
