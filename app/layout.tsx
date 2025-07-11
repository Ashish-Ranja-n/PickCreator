import type { Metadata, Viewport } from "next";
import {  Rubik_Mono_One , Kanit, Cambay } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { SessionRefresher } from './SessionRefresher';
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeEffect } from "@/components/theme/theme-effect";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const kanit = Kanit({
  weight: ["400"],
  variable: "--font-kanit",
  subsets: ["latin"],
})
const RubikMonoOne = Rubik_Mono_One({
  weight: ["400"],
  variable: "--font-rubik",
  subsets: ["latin"],
});

const cambay = Cambay({
  weight: ["700"],
  variable: "--font-cambay",
  subsets: ["latin"],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  themeColor: '#fafafa', // Subtle light shade instead of pure white
  // Prevent text size adjustment on mobile devices
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "PickCreator",
  description: "PickCreator is a platform that connects influencers with brands and creators to create unique deals and partnerships.",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PickCreator',
  },
  applicationName: 'PickCreator',
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'application-name': 'PickCreator',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#fafafa', // Subtle light shade
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Pickcreator" />
        <meta name="application-name" content="PickCreator" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PickCreator" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#fafafa" />
        <meta name="theme-color" content="#fafafa" />


        {/* Immediate theme restoration script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Immediate restoration from sessionStorage
                  const cachedColor = sessionStorage.getItem('current-theme-color');
                  const cachedStyle = sessionStorage.getItem('current-status-bar-style');

                  if (cachedColor && cachedStyle) {
                    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
                    if (themeColorMeta) themeColorMeta.setAttribute('content', cachedColor);

                    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
                    if (statusBarMeta) statusBarMeta.setAttribute('content', cachedStyle);

                    document.documentElement.style.setProperty('--theme-color', cachedColor);
                  } else {
                    // Fallback: detect theme from localStorage or system preference
                    const theme = localStorage.getItem('theme') || 'light';
                    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    const isDark = theme === 'dark' || (theme === 'system' && systemDark);
                    const themeColor = isDark ? '#0a0a0a' : '#fafafa';
                    const statusBarStyle = isDark ? 'black-translucent' : 'default';

                    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
                    if (themeColorMeta) themeColorMeta.setAttribute('content', themeColor);

                    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
                    if (statusBarMeta) statusBarMeta.setAttribute('content', statusBarStyle);

                    document.documentElement.style.setProperty('--theme-color', themeColor);

                    // Cache for next time
                    sessionStorage.setItem('current-theme-color', themeColor);
                    sessionStorage.setItem('current-status-bar-style', statusBarStyle);
                  }
                } catch (e) {
                  // Silently fail if sessionStorage is not available
                }
              })();
            `,
          }}
        />
      </head>

      <body
        className={`${kanit.variable} ${RubikMonoOne.variable} ${cambay.variable} h-screen antialiased m-0 p-0 `}
      >
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <ThemeEffect />
            <ServiceWorkerRegistration />
            <SessionRefresher />
            {children}
            <Analytics />
            <SpeedInsights />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
