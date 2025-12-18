"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { queries } from "@/lib/queries";
import { useSidebar } from "@/lib/sidebarContext";
import {
  Users,
  BookOpen,
  Play,
  ChevronDown,
  Library,
  Plus,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  User,
  LogIn,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { LoginModal } from "./LoginModal";

const globalNavItems = [
  { href: "/stories", label: "Stories", icon: Library },
  { href: "/characters", label: "Characters", icon: Users },
];

const storyNavItems = [
  { href: "/scenarios", label: "Scenarios", icon: BookOpen },
  { href: "/viewer", label: "Viewer", icon: Play },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: stories } = useQuery(queries.stories());
  const { isCollapsed, isMobileOpen, isMobile, hasMounted, toggle, toggleMobile, closeMobile } = useSidebar();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check if we're in a story context
  const storyMatch = pathname.match(/^\/stories\/([^/]+)/);
  const currentStorySlug = storyMatch?.[1];
  const currentStory = stories?.find((s) => s.slug === currentStorySlug);
  const isInStory = !!currentStorySlug && currentStorySlug !== "new";

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // On mobile, always show expanded when open
  const effectiveIsCollapsed = isMobile ? false : isCollapsed;

  return (
    <>
      {/* Mobile hamburger button - only render after mount to avoid hydration mismatch */}
      {hasMounted && isMobile && (
        <button
          onClick={toggleMobile}
          className="fixed top-3 right-3 z-50 p-2 rounded-lg bg-sidebar border border-sidebar-border hover:bg-sidebar-accent transition-colors"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Mobile backdrop */}
      {hasMounted && isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "h-full bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300",
          // Mobile styles - only apply after mount to avoid hydration mismatch
          hasMounted && isMobile && "fixed inset-y-0 left-0 z-40",
          hasMounted && isMobile && !isMobileOpen && "-translate-x-full",
          hasMounted && isMobile && isMobileOpen && "translate-x-0 w-64",
          // Desktop styles (default for SSR)
          (!hasMounted || !isMobile) && (isCollapsed ? "w-16" : "w-56")
        )}
      >
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
        <Link
          href="/stories"
          className={cn(
            "flex items-center gap-2 overflow-hidden",
            effectiveIsCollapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">CE</span>
          </div>
          {!effectiveIsCollapsed && (
            <span className="font-semibold text-sidebar-foreground whitespace-nowrap">
              Comic Editor
            </span>
          )}
        </Link>
        {!effectiveIsCollapsed && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={toggle}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {effectiveIsCollapsed && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10"
            onClick={toggle}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <nav className={cn("flex-1 p-2 space-y-4", effectiveIsCollapsed && "p-1")}>
        {/* Story Switcher (when in story context) */}
        {isInStory && (
          <div className="space-y-2">
            {!effectiveIsCollapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full">
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md text-sm",
                      "bg-sidebar-accent text-sidebar-foreground",
                      "hover:bg-sidebar-accent/80 transition-colors"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Library className="h-4 w-4 shrink-0" />
                      <span className="truncate font-medium">
                        {currentStory?.name ?? currentStorySlug}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  {stories?.map((story) => (
                    <DropdownMenuItem key={story.slug} asChild>
                      <Link
                        href={`/stories/${story.slug}/scenarios`}
                        className={cn(
                          story.slug === currentStorySlug && "bg-accent"
                        )}
                      >
                        {story.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {stories && stories.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem asChild>
                    <Link href="/stories/new" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Story
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/stories" className="flex items-center gap-2">
                      <Library className="h-4 w-4" />
                      All Stories
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/stories/${currentStorySlug}/scenarios`}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-md",
                      "bg-sidebar-accent text-sidebar-foreground",
                      "hover:bg-sidebar-accent/80 transition-colors"
                    )}
                  >
                    <Library className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {currentStory?.name ?? currentStorySlug}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Story-specific navigation */}
            <ul
              className={cn(
                "space-y-1",
                !effectiveIsCollapsed && "pl-2 border-l-2 border-sidebar-border ml-2"
              )}
            >
              {storyNavItems.map((item) => {
                const href = `/stories/${currentStorySlug}${item.href}`;
                const isActive =
                  pathname === href ||
                  (item.href !== "" && pathname.startsWith(href));

                const linkContent = (
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-md text-sm transition-colors",
                      effectiveIsCollapsed ? "justify-center p-2" : "px-3 py-2",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("shrink-0", effectiveIsCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                    {!effectiveIsCollapsed && <span>{item.label}</span>}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {effectiveIsCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      linkContent
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Global Navigation */}
        <div className="space-y-1">
          {!effectiveIsCollapsed && (
            <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isInStory ? "Global" : "Navigation"}
            </p>
          )}
          <ul className="space-y-1">
            {globalNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (!isInStory && pathname.startsWith(item.href));

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md text-sm transition-colors",
                    effectiveIsCollapsed ? "justify-center p-2" : "px-3 py-2",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("shrink-0", effectiveIsCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                  {!effectiveIsCollapsed && <span>{item.label}</span>}
                </Link>
              );

              return (
                <li key={item.href}>
                  {effectiveIsCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer with auth */}
      <div className={cn(
        "border-t border-sidebar-border",
        effectiveIsCollapsed ? "p-2" : "p-3"
      )}>
        {authLoading ? (
          <div className={cn(
            "animate-pulse rounded bg-muted",
            effectiveIsCollapsed ? "h-10 w-10 mx-auto" : "h-10 w-full"
          )} />
        ) : isAuthenticated ? (
          effectiveIsCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 py-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">
                  Logged in
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )
        ) : (
          effectiveIsCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="w-full h-10"
                  onClick={() => setShowLoginModal(true)}
                >
                  <LogIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign In</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => setShowLoginModal(true)}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )
        )}

        {!effectiveIsCollapsed && (
          <p className="text-xs text-muted-foreground mt-3 px-2">
            Powered by Convex + Gemini
          </p>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </aside>
    </>
  );
}
