import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/hooks/use-sidebar";
import LayoutContent from "@/components/LayoutContent";
import { getSession } from "@/lib/auth";
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/theme-provider";

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
  description: "Sistem Manajemen Kehadiran Karyawan dan Security",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

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
          {session ? (
            <SidebarProvider>
              <Sidebar user={session} />
              <LayoutContent user={session}>
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
