export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl text-gray-600 mb-8">Page Not Found</h2>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <a
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go back home
      </a>
    </div>
  );
} 