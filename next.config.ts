import type { NextConfig } from "next";

/**
 * GitHub Pages serves this from https://<user>.github.io/<repo>, so every URL
 * needs that prefix — but only there. Local dev and any root-domain host stay
 * unprefixed, so the prefix comes from the environment rather than being
 * hardcoded. The deploy workflow sets NEXT_PUBLIC_BASE_PATH.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Static HTML export — no Node server, which is all Pages can serve.
  output: "export",
  basePath: basePath || undefined,
  // Pages resolves /foo to /foo/index.html, so emit directory-style routes.
  trailingSlash: true,
  // The Image Optimization API needs a server; there is none here.
  images: { unoptimized: true },
};

export default nextConfig;
