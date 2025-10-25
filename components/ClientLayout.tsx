'use client';

import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  // Don't apply auth guard or sidebar to login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Apply auth guard and sidebar to all other pages
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-black">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-56">
          <main className="flex-1 p-6">
            <div className="h-full bg-[#f5f5f0] rounded-2xl border border-gray-300 overflow-hidden" style={{ borderWidth: '0.5px' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}