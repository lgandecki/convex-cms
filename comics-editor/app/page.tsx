"use client";

import Link from "next/link";
import { Users, BookOpen, Sparkles, Images } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Characters",
    description: "Browse and edit your comic characters",
    href: "/characters",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Scenarios",
    description: "Create and manage comic scenarios",
    href: "/scenarios",
    icon: BookOpen,
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    title: "Generate",
    description: "Generate comic strips with AI",
    href: "/generate",
    icon: Sparkles,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "Gallery",
    description: "View all generated comic strips",
    href: "/gallery",
    icon: Images,
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

export default function Home() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Comic Editor</h1>
          <p className="text-muted-foreground">
            Create and manage your comic strips with AI-powered generation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className={cn(
                "group p-6 rounded-lg border border-border bg-card",
                "hover:border-primary/50 hover:shadow-glow-sm transition-all duration-200"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-lg", feature.bgColor)}>
                  <feature.icon className={cn("h-6 w-6", feature.color)} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-lg border border-border bg-card/50">
          <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                1
              </span>
              <span>Review your characters in the Characters section</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                2
              </span>
              <span>Create a new scenario or edit an existing one</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                3
              </span>
              <span>Generate your comic strip with AI</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                4
              </span>
              <span>View and download your creations in the Gallery</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
