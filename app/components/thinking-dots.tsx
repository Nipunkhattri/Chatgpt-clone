'use client';

export default function ThinkingDots() {
  return (
    <div className="flex items-center gap-2 p-4 mb-6">
      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
        <div className="w-4 h-4 bg-white rounded-sm"></div>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse loading-dot"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse loading-dot"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse loading-dot"></div>
        </div>
      </div>
    </div>
  );
}