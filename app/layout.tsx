import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import ClientLayout from "@/components/ClientLayout";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Sutr Admin - Dashboard",
  description: "Admin dashboard for Sutr Clothing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800&display=swap" 
          as="style"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


