import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TTS App - Text to Speech",
  description:
    "Browser-based Text-to-Speech for Vietnamese and English using Piper TTS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
