'use client';

import Logo from '@/components/Logo';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="p-3 bg-gray-900 rounded-xl">
              <Logo width={48} height={48} className="h-12 w-auto" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            for Sutr Clothing
          </p>
          <p className="mt-4 text-xs text-gray-500 leading-relaxed">
            Manage your store inventory, orders, customers, and analytics from one central hub. Secure access for authorized administrators only.
          </p>
        </div>

        {/* Login Form Container */}
        <div className="border border-gray-200 rounded-lg p-8 bg-white shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

