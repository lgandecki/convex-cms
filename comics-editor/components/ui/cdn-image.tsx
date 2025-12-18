"use client";

import Image, { ImageProps } from "next/image";

/**
 * CDN-optimized Image component that bypasses Next.js image optimization.
 *
 * Use this for images served from our CDN (Convex) since:
 * 1. Images are already optimized JPEGs from generation
 * 2. Vercel CDN caches raw files efficiently
 * 3. Avoids cold-start latency from Next.js on-demand optimization
 */
export function CdnImage(props: ImageProps) {
  return <Image {...props} unoptimized />;
}
