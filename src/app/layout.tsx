import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polygon View",
  description: "A minimalist strategy performance dashboard for monitoring signals, settlements, win rate, and recent outcomes from Supabase data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
