import type { NextConfig } from "next";

const buildSha = process.env.WARDRO_BUILD_SHA ?? process.env.GITHUB_SHA ?? "development";

const nextConfig: NextConfig = {
  env: {
    WARDRO_BUILD_SHA: buildSha,
    NEXT_PUBLIC_WARDRO_BUILD_SHA: buildSha,
  },
};

export default nextConfig;
