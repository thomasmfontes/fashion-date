import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function getCommitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return `build-${Date.now()}`;
  }
}

const buildVersion = getCommitSha();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => buildVersion,
  env: {
    NEXT_PUBLIC_BUILD_VERSION: buildVersion,
  },
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
