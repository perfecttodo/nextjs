import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleLoginButton from "./components/GoogleLoginButton";
import { getSessionUser } from "@/lib/session";
import Nav from "./components/Nav";
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tayino",
  description: "Promote your productivity",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="px-4 py-3 flex items-center justify-between">
          <Nav />
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
              <span><Link href="/audio-manage" className="text-sm text-gray-600">Audio Manage</Link></span>
                <span className="text-sm text-gray-600">{user.name || user.email}</span>
                <form action="/api/auth/logout" method="post">
                  <button className="text-sm underline" type="submit">Logout</button>
                </form>
              </>
            ) : (
              <GoogleLoginButton />
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
