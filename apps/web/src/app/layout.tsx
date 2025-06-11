import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Header } from "@/components/ui/header";
import { ModelProvider } from "@/contexts/ModelContext";
import { UserProvider } from "@/contexts/UserContext";
import { ThreadProvider } from "@/contexts/ThreadProvider";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { GraphProvider } from "@/contexts/GraphContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nova",
  description: "Nova Chat UX by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen">
      <body className={cn("min-h-full", inter.className)}>
        <NuqsAdapter>
          <UserProvider>
            <ThreadProvider>
              <AssistantProvider>
                <GraphProvider>
                  <ModelProvider>
                    <Header />
                    <main className="flex-1">
                      {children}
                    </main>
                  </ModelProvider>
                </GraphProvider>
              </AssistantProvider>
            </ThreadProvider>
          </UserProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
