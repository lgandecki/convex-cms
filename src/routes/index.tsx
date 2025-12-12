// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import { AdminPanel } from "../admin/AdminPanel";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Authenticated>
      <AdminPanel />
    </Authenticated>
  );
}
