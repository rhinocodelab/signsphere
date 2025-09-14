import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { appConfig } from "@/config/app-config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SignSphere - Western Railway Divyangjan Announcement System",
  description: "Accessible railway announcements for deaf and hard of hearing passengers using Indian Sign Language",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <main className="flex-1">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <span>{appConfig.login.footer.copyright}</span>
                <span>|</span>
                <span>{appConfig.login.footer.poweredBy.text}</span>
                <a
                  href={appConfig.login.footer.poweredBy.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  {appConfig.login.footer.poweredBy.companyName}
                </a>
              </div>
            </div>
          </div>
        </footer>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
