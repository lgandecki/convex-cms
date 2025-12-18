import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/Navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider } from "@/lib/sidebarContext";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Comic Editor",
  description: "Create and manage comic strips with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <AuthGuard>
            <SidebarProvider>
              <TooltipProvider delayDuration={0}>
                <div className="flex h-screen overflow-hidden">
                  <Navigation />
                  <main className="flex-1 overflow-auto bg-background">{children}</main>
                </div>
              </TooltipProvider>
            </SidebarProvider>
            <Toaster />
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
