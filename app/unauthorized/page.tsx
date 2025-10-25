import Link from 'next/link';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        <ShieldExclamationIcon className="mx-auto h-24 w-24 text-red-500" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          Unauthorized Access
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          You don't have permission to access the admin dashboard.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Please contact your administrator if you believe this is an error.
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
