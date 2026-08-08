'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mx-auto">
            ⚠
          </div>
          <h2 className="text-lg font-bold">Something went wrong!</h2>
          <p className="text-zinc-400 text-xs leading-relaxed">
            A critical application error occurred in the system. Our operations team has been notified.
          </p>
          {error?.message && (
            <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-500 overflow-x-auto text-left font-mono">
              {error.message}
            </pre>
          )}
          <button
            onClick={() => reset()}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
