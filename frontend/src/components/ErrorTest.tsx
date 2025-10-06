/**
 * Development-only component for testing ErrorBoundary
 *
 * Remove this file before production deployment
 */

import { useState } from 'react';

export function ErrorTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error: ErrorBoundary is working!');
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShouldThrow(true)}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-lg"
        title="Click to test ErrorBoundary"
      >
        🧪 Test Error
      </button>
    </div>
  );
}
