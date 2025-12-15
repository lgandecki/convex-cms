"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookOpen, Sparkles, Images } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/characters", label: "Characters", icon: Users },
  { href: "/scenarios", label: "Scenarios", icon: BookOpen },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/gallery", label: "Gallery", icon: Images },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-full bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">CE</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">
            Comic Editor
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground">
          Powered by Convex + Gemini
        </p>
      </div>
    </aside>
  );
}
