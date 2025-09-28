'use client';

import { CheckCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface CircularProgressProps {
  progress: number; // 0 to 100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  isCompleted?: boolean;
  className?: string;
}

export function CircularProgress({
  progress,
  size = 40,
  strokeWidth = 3,
  isCompleted = false,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (isCompleted) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <CheckCircle 
          size={size - 8} 
          className="text-green-400 animate-in zoom-in-75 duration-300" 
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="transition-all duration-300"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progress > 0 ? "#ef4444" : "rgba(255, 255, 255, 0.4)"}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: progress > 0 ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))' : 'none'
          }}
        />
      </svg>
      
      {/* Progress percentage text */}
      {/* <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-white">
          {Math.round(progress)}%
        </span>
      </div> */}
    </div>
  );
}

interface UploadProgressIndicatorProps {
  fileName: string;
  progress: number;
  isCompleted?: boolean;
  className?: string;
}

export function UploadProgressIndicator({
  fileName,
  progress,
  isCompleted = false,
  className,
}: UploadProgressIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg border border-gray-700", className)}>
      <CircularProgress 
        progress={progress} 
        isCompleted={isCompleted}
        size={36}
        strokeWidth={2.5}
      />
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {fileName}
        </div>
        <div className="text-xs text-gray-400">
          {isCompleted ? 'Upload completed' : `Uploading... ${Math.round(progress)}%`}
        </div>
      </div>
    </div>
  );
}