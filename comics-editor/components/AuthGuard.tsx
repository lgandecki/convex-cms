"use client";

import { ReactNode } from "react";
import { useConvexAuth } from "convex/react";
import { LoginModal } from "./LoginModal";

interface AuthGuardProps {
  children: ReactNode;
}

// Auth is disabled by default for easy collaboration
// Set NEXT_PUBLIC_AUTH_REQUIRED=true to require login
const AUTH_REQUIRED = process.env.NEXT_PUBLIC_AUTH_REQUIRED === "true";

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Skip auth check if not required
  if (!AUTH_REQUIRED) {
    return <>{children}</>;
  }

  return (
    <>
      <LoginModal open={!isLoading && !isAuthenticated} />
      {children}
    </>
  );
}
