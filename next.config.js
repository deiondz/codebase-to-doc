/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // pdfkit reads .afm font files via __dirname; bundling breaks that path.
  serverExternalPackages: ["pdfkit"],
};

export default config;
