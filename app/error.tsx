'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 在开发环境中输出错误到控制台
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Something went wrong</h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        An unexpected error has occurred. Please try again later.
      </p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
      <a
        href="/"
        className="mt-4 text-blue-600 hover:underline"
      >
        Go back home
      </a>
    </div>
  );
} 