'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import Logo from '@/components/Logo';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't apply auth guard or sidebar to login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Apply auth guard and sidebar to all other pages
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-black">
        <Sidebar 
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        
        <div className="flex-1 flex flex-col lg:ml-56">
          {/* Mobile Header with Hamburger */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-black border-b border-gray-800">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-white hover:bg-gray-900 rounded-lg"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-2">
                <Logo width={32} height={32} className="h-8 w-auto" />
                <span className="text-white text-lg font-semibold">Admin</span>
              </div>
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>
          </div>

          <main className="flex-1 p-2 sm:p-3 lg:pt-3 pt-16">
            <div className="h-full bg-[#f5f5f0] rounded-2xl border border-gray-300 overflow-hidden" style={{ borderWidth: '0.5px' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}