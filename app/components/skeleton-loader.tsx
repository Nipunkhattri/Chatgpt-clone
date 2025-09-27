'use client';

interface SkeletonLoaderProps {
  type?: 'chat' | 'message' | 'sidebar';
  count?: number;
}

export default function SkeletonLoader({ type = 'chat', count = 3 }: SkeletonLoaderProps) {
  if (type === 'chat') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-pulse">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="space-y-4">
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-gray-700/30 rounded-2xl p-4 space-y-2">
                <div className="h-4 bg-gray-600/40 rounded w-3/4"></div>
                <div className="h-4 bg-gray-600/40 rounded w-1/2"></div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400/40 to-blue-500/40 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 bg-gray-400/40 rounded-sm"></div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-600/40 rounded w-full"></div>
                  <div className="h-4 bg-gray-600/40 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-600/40 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-600/40 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (type === 'message') {
    return (
      <div className="flex items-start gap-3 animate-pulse">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400/40 to-blue-500/40 rounded-full flex items-center justify-center flex-shrink-0">
          <div className="w-4 h-4 bg-gray-400/40 rounded-sm"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <div className="h-4 bg-gray-600/40 rounded w-full"></div>
            <div className="h-4 bg-gray-600/40 rounded w-5/6"></div>
            <div className="h-4 bg-gray-600/40 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'sidebar') {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="p-3 rounded-lg bg-gray-700/30">
            <div className="h-4 bg-gray-600/40 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-600/30 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return null;
}