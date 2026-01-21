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
import ActivityTracker from "@/components/ActivityTracker";
import LocationTracker from "@/components/LocationTracker";
import InstallPWA from "@/components/InstallPWA";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cluster Taman Marunda",
  description: "Sistem Terintegrasi Hunian dan Manajemen Operasional – Solusi Digital untuk Layanan Warga, Kehadiran Karyawan, dan Keamanan Cluster Taman Marunda",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cluster Taman Marunda",
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
  let sidebarUser: { id: string; name: string; role: string; image: string | null } | null = null;

  if (session?.userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, role: true, username: true, image: true, isPasswordDefault: true }
      });
      if (dbUser) {
        // safe spread since dbUser fields match SessionPayload structure (except image is string|null vs optional)
        currentUser = {
          userId: session.userId,
          // Ensure role is cast correctly or validated. 
          // dbUser.role is from Prisma options, should match UserRole.
          role: dbUser.role as unknown as UserRole,
          username: dbUser.username,
          isPasswordDefault: dbUser.isPasswordDefault,
          image: dbUser.image,
          iat: session.iat
        };

        // Create sidebar-compatible user object
        sidebarUser = {
          id: session.userId,
          name: dbUser.name,
          role: dbUser.role,
          image: dbUser.image
        };
      }
    } catch (error) {
      console.error("Error fetching user from database during layout render:", error);
      // Keep sidebarUser as null and currentUser as the session data
      currentUser = session;
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
          <InstallPWA />
          {currentUser ? (
            <SidebarProvider>
              <ActivityTracker userId={currentUser.userId} username={currentUser.username} />
              <LocationTracker userId={currentUser.userId} role={currentUser.role} />
              <Sidebar user={sidebarUser} />
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
