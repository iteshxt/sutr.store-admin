'use client';

import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">
          View sales and performance analytics
        </p>
      </div>

      <div className="rounded-lg bg-white border border-gray-200 p-8 sm:p-12 shadow-sm text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
        <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900">Coming Soon</h3>
        <p className="mt-2 text-sm text-gray-500">
          Advanced analytics and reporting features will be available here.
        </p>
      </div>
    </div>
  );
}
