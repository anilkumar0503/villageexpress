import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from root .env file
config({ path: resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@ve/ui", "@ve/utils", "@ve/types", "@ve/db"],
  env: {
    NEXT_PUBLIC_RAZORPAY_ENABLED: process.env.NEXT_PUBLIC_RAZORPAY_ENABLED,
  },
};

export default nextConfig;
