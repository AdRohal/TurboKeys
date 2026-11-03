import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Layout from "@/components/Layout/Layout";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TurboKeys - Typing Speed Test", template: "%s | TurboKeys" },
  description: "TurboKeys - Test your typing speed and accuracy with our modern typing test application",
  manifest: "/manifest.json",
  icons: { icon: "/Logo/icon.ico", apple: "/Logo/icon.png" },
};

export const viewport: Viewport = { themeColor: "#000000" };

// Runs before the first paint so a saved light theme does not flash dark.
const themeScript = `try{var t=localStorage.getItem('theme');var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t==='light'?'light':'dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Layout>{children}</Layout>
            <SpeedInsights />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
