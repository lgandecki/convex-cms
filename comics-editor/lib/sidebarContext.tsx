"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface SidebarContextValue {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isMobile: boolean;
  hasMounted: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

// Check if we're on mobile (< 768px)
function getIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize with false to match server render, update after mount
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Update mobile state on window resize and after mount
  useEffect(() => {
    const handleResize = () => {
      const mobile = getIsMobile();
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
        setIsMobileOpen(false);
      }
    };
    // Set initial state on mount
    handleResize();
    setHasMounted(true);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = useCallback(() => setIsCollapsed((prev) => !prev), []);
  const collapse = useCallback(() => setIsCollapsed(true), []);
  const expand = useCallback(() => setIsCollapsed(false), []);
  const toggleMobile = useCallback(() => setIsMobileOpen((prev) => !prev), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, isMobileOpen, isMobile, hasMounted, toggle, collapse, expand, toggleMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
