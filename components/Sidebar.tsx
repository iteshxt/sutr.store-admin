'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';
import { useEffect, useState } from 'react';
import {
  HomeIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  UsersIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: ShoppingBagIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Statistic', href: '/statistics', icon: ChartBarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [adminName, setAdminName] = useState<string>('Admin');

  useEffect(() => {
    const fetchAdminName = async () => {
      if (!user) return;
      
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.profile?.name) {
            setAdminName(data.profile.name);
          }
        }
      } catch (error) {
        console.error('Error fetching admin name:', error);
      }
    };

    fetchAdminName();
  }, [user]);

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-56 bg-black flex flex-col py-8 px-4">
      {/* Logo Section */}
      <div className="flex items-center justify-center px-4 mb-10">
        <Logo 
          className="h-12 w-auto"
          width={150}
          height={48}
          alt="Sutr Admin Logo"
        />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white text-black! font-medium'
                  : 'text-gray-400! hover:text-white! hover:bg-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile & Logout */}
      <div className="space-y-2 pt-4 border-t border-gray-800">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            pathname === '/profile'
              ? 'bg-white text-black! font-medium'
              : 'text-gray-400! hover:text-white! hover:bg-gray-900'
          }`}
        >
          <UserCircleIcon className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{adminName}</p>
            <p className={`text-xs ${pathname === '/profile' ? 'text-gray-600' : 'text-gray-500'}`}>View Profile</p>
          </div>
        </Link>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400! hover:text-white! hover:bg-gray-900 transition-all"
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0" />
          <span className="text-sm">Log out</span>
        </button>
      </div>
    </div>
  );
}



