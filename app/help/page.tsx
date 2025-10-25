'use client';

import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function HelpPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-sm text-gray-600 mt-1">Get assistance and learn how to use the platform</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
              <p className="text-sm text-gray-600">
                Comprehensive guides and tutorials to help you get started.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQs</h3>
              <p className="text-sm text-gray-600">
                Find answers to commonly asked questions.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h3>
              <p className="text-sm text-gray-600">
                Reach out to our support team for assistance.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Tutorials</h3>
              <p className="text-sm text-gray-600">
                Watch step-by-step video guides for key features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
