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
        source: "/app",
        destination: "/home",
        permanent: true,
      },
      {
        source: "/sucesso",
        destination: "/home",
        permanent: true,
      },
      {
        source: "/cadastro-duplicado",
        destination: "/home",
        permanent: true,
      },
      {
        source: "/cadastro",
        destination: "/inscricao",
        permanent: true,
      },
      {
        source: "/inicio",
        destination: "/home",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/home",
        permanent: true,
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
