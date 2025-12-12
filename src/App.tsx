"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

// Note: App entry point is now in src/routes/index.tsx (TanStack Start)
export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col gap-8 w-96 p-8 bg-card rounded-lg border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Asset Manager</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to manage your assets
          </p>
        </div>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            formData.set("flow", flow);
            void signIn("password", formData).catch((error) => {
              setError(error.message);
            });
          }}
        >
          <input
            className="bg-background text-foreground rounded-md p-3 border border-input focus:outline-none focus:ring-2 focus:ring-ring"
            type="email"
            name="email"
            placeholder="Email"
          />
          <input
            className="bg-background text-foreground rounded-md p-3 border border-input focus:outline-none focus:ring-2 focus:ring-ring"
            type="password"
            name="password"
            placeholder="Password"
          />
          <button
            className="bg-primary text-primary-foreground rounded-md p-3 font-medium hover:brightness-110 transition-all"
            type="submit"
          >
            {flow === "signIn" ? "Sign in" : "Sign up"}
          </button>
          <div className="flex flex-row gap-2 text-sm justify-center">
            <span className="text-muted-foreground">
              {flow === "signIn"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>
            <span
              className="text-primary cursor-pointer hover:underline"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Sign up" : "Sign in"}
            </span>
          </div>
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
