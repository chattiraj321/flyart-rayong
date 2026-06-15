import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "FlyArt Rayong | Art Studio Manager",
  description: "Track student progress, manage course lessons, view registrations, and log drawings on-the-go.",
};

export const viewport: Viewport = {
  themeColor: "#c95c3f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex justify-center bg-[#121211] min-h-screen text-[#1c1b18]">
        {/* Mobile viewport mock frame container */}
        <div className="relative flex flex-col w-full max-w-md min-h-screen bg-[#fbfaf7] border-x border-[#eae7df] shadow-2xl pb-24 overflow-x-hidden">
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto px-4 pt-6">
            {children}
          </main>

          {/* Persistent Bottom Nav Bar */}
          <NavBar />
        </div>
      </body>
    </html>
  );
}
