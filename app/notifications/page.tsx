'use client';

import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">Stay updated with all your alerts</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="text-center">
          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No Notifications</h3>
          <p className="mt-2 text-sm text-gray-600">
            You're all caught up! No new notifications at the moment.
          </p>
        </div>
      </div>
    </div>
  );
}
