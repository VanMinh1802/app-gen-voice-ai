const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tránh 404 cho source map của onnxruntime-web (ort.bundle.min.mjs.map)
  async rewrites() {
    return [
      {
        source: "/_next/static/media/ort.bundle.min.mjs.map",
        destination: "/empty-source-map.json",
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    if (dev) {
      // Avoid ENOENT on .next/cache/webpack/.../1.pack.gz (PackFileCacheStrategy race/missing file)
      config.cache = false;
    }
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        child_process: false,
      };

      // Use webpack alias to replace async_hooks with stub for Cloudflare Pages edge runtime
      const asyncHooksPath = require.resolve("./src/app/api/v1/auth/async_hooks.js");
      config.resolve.alias = {
        ...config.resolve.alias,
        async_hooks: asyncHooksPath,
      };
    }

    return config;
  },
  async headers() {
    return [
      // Bỏ COEP/COOP — gây blocked:COEP-frame cho chunks, model không load
      // {
      //   source: "/:path*",
      //   headers: [
      //     { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      //     { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
      //   ],
      // },
      {
        source: "/onnx/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
