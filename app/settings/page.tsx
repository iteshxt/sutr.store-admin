'use client';

import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your store settings and preferences
        </p>
      </div>

      <div className="rounded-lg bg-white border border-gray-200 p-12 shadow-sm text-center">
        <Cog6ToothIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Coming Soon</h3>
        <p className="mt-2 text-sm text-gray-500">
          Store settings, email templates, and configuration options will be available here.
        </p>
      </div>
    </div>
  );
}
