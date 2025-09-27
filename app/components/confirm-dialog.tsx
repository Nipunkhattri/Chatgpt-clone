'use client';

import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-[#2f2f2f] rounded-lg shadow-xl max-w-md w-full border border-[#4f4f4f]">
        <div className="flex items-center justify-between p-6 border-b border-[#4f4f4f]">
          <h3 className="text-lg font-semibold text-white">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-[#3f3f3f] rounded-md transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-300 mb-6">
            {message}
          </p>
          
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#3f3f3f] rounded-md transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                isDangerous 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}