'use client';

import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm text-gray-600">
          View sales and performance analytics
        </p>
      </div>

      <div className="rounded-lg bg-white border border-gray-200 p-12 shadow-sm text-center">
        <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Coming Soon</h3>
        <p className="mt-2 text-sm text-gray-500">
          Advanced analytics and reporting features will be available here.
        </p>
      </div>
    </div>
  );
}
