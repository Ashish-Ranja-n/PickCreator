import type { Metadata, Viewport } from "next";
import {  Rubik_Mono_One , Kanit, Cambay } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { SessionRefresher } from './SessionRefresher';

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
  userScalable: true,
  themeColor: '#ffffff',
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
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body
        className={`${kanit.variable} ${RubikMonoOne.variable} ${cambay.variable} h-screen antialiased m-0 p-0 `}
      >
        <Providers>
            <ServiceWorkerRegistration />
            <SessionRefresher />
            {children}
            <Toaster />
        </Providers>
      </body>
    </html>
  );
}
