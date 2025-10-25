'use client';

import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="flex justify-center">
            <Logo />
          </div>
          <h2 className="mt-8 text-center text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600">
            Sign in to access the admin panel
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

