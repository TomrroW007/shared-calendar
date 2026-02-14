import "./globals.css";

export const metadata = {
  title: "共享日历 — 朋友间的可用性同步工具",
  description: "轻松标记休假/忙碌状态，与朋友实时查看彼此的可用性。",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import PushManager from "@/components/PushManager";
import CommandPalette from "@/components/CommandPalette";
import BottomNav from "@/components/BottomNav";
import DesktopSidebar from "@/components/DesktopSidebar";

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#030014" />
        <meta name="manifest" content="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body>
        {/* Cosmic Nebula Clouds */}
        <div className="cosmic-cloud-1" />
        <div className="cosmic-cloud-2" />

        <div className="app-layout">
          <DesktopSidebar />
          <main className="main-content">
            <div className="page-content-wrapper">{children}</div>
          </main>
        </div>
        <PushManager />
        <CommandPalette />
        <BottomNav />
      </body>
    </html>
  );
}
