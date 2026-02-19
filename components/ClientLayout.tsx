'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import Logo from '@/components/Logo';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useSessionTimeout } from '@/lib/use-session-timeout';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isDocumentationPage = pathname.startsWith('/docs');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Initialize session timeout and get warning state
  const warning = useSessionTimeout();

  // Don't apply auth guard or sidebar to login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Don't apply sidebar to documentation page - just auth guard
  if (isDocumentationPage) {
    return (
      <AuthGuard>
        {children}
      </AuthGuard>
    );
  }

  // Apply auth guard and sidebar to all other pages
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-black">
        {/* Session Warning Modal */}
        {warning.show && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 max-w-sm mx-4 shadow-2xl">
              <h2 className="text-2xl font-bold text-red-600 mb-2">Session Expiring</h2>
              <p className="text-gray-700 mb-6">Your session will expire in:</p>
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-red-600">
                  {Math.floor(warning.countdown / 60)}:{String(warning.countdown % 60).padStart(2, '0')}
                </div>
                <p className="text-gray-600 mt-2">minutes remaining</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(warning.countdown / 300) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
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

          <main className="flex-1 p-1 sm:p-2 lg:p-3 pt-16 relative z-0 w-full overflow-x-hidden">
            <div className="h-full bg-[#f5f5f0] rounded-2xl border border-gray-300 overflow-hidden relative w-full" style={{ borderWidth: '0.5px' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}