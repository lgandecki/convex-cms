"use client";

import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface GenerationResultProps {
  imageUrl: string;
  scenarioName: string;
}

export function GenerationResult({
  imageUrl,
  scenarioName,
}: GenerationResultProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scenarioName}-comic.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Image preview */}
      <div className="relative rounded-lg overflow-hidden border bg-card">
        <img
          src={imageUrl}
          alt={`Generated comic: ${scenarioName}`}
          className="w-full h-auto"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleDownload} variant="default">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          onClick={() => window.open(imageUrl, "_blank")}
          variant="outline"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Full Size
        </Button>
      </div>
    </div>
  );
}
