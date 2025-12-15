"use client";

import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { RecentSubmissions } from "@/components/gallery/RecentSubmissions";

export default function GalleryPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gallery</h1>
          <p className="text-muted-foreground">
            View all your generated comic strips. Click on any comic to view it
            in full size.
          </p>
        </div>

        <RecentSubmissions />

        <GalleryGrid />
      </div>
    </div>
  );
}
