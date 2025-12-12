// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import Odyssey from "@/odyssey/Odyssey";
import "@/odyssey/index.css";

export const Route = createFileRoute("/")({
  component: OdysseyPage,
});

function OdysseyPage() {
  return <Odyssey />;
}
