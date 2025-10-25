'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';
import {
  HomeIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  UsersIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
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

const bottomNavigation = [
  { name: 'Notification', href: '/notifications', icon: BellIcon },
  { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

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

      {/* Bottom Navigation */}
      <div className="space-y-2 pt-4 border-t border-gray-800">
        {bottomNavigation.map((item) => {
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
      </div>

      {/* Logout Button */}
      <div className="pt-4 mt-4 border-t border-gray-800">
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



