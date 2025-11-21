export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
