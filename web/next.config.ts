import { withNetlify } from '@netlify/next'
import type { NextConfig } from "next";

const nextConfig: NextConfig = withNetlify({
  // No additional config needed
});

export default nextConfig;
