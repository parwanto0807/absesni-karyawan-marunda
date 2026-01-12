import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/hooks/use-sidebar";
import LayoutContent from "@/components/LayoutContent";
import { getSession } from "@/lib/auth";
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/theme-provider";
import { prisma } from "@/lib/db";
import { SessionPayload, UserRole } from "@/types/auth"; // import UserRole for casting if needed

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Absensi Karyawan Marunda",
  description: "Sistem Manajemen Kehadiran Karyawan dan Security - Manage Access with Ease and Security",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Absensi Karyawan Marunda",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png" },
    ],
    shortcut: ["/icon-192x192.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  let currentUser: SessionPayload | null = session;

  if (session?.userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, role: true, username: true, image: true }
    });
    if (dbUser) {
      // safe spread since dbUser fields match SessionPayload structure (except image is string|null vs optional)
      currentUser = {
        userId: session.userId,
        // Ensure role is cast correctly or validated. 
        // dbUser.role is from Prisma options, should match UserRole.
        role: dbUser.role as unknown as UserRole,
        username: dbUser.username,
        image: dbUser.image,
        iat: session.iat
      };
    }
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 dark:bg-slate-950`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" richColors closeButton />
          {currentUser ? (
            <SidebarProvider>
              <Sidebar user={currentUser} />
              <LayoutContent user={currentUser}>
                {children}
              </LayoutContent>
            </SidebarProvider>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
