import type { Metadata } from "next";
import { Be_Vietnam_Pro, Outfit } from "next/font/google";
import { R2ConfigProvider } from "@/components/R2ConfigProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/AuthProvider";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GenVoice AI - Text to Speech",
  description:
    "Browser-based Text-to-Speech for Vietnamese and English using Piper TTS",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var k = 'theme';
  var stored = typeof localStorage !== 'undefined' && localStorage.getItem(k);
  var prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
})();
            `.trim(),
          }}
        />
      </head>
      <body className={`${beVietnamPro.variable} ${outfit.variable} min-h-screen bg-background antialiased font-sans`} suppressHydrationWarning>
        <R2ConfigProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </R2ConfigProvider>
      </body>
    </html>
  );
}
