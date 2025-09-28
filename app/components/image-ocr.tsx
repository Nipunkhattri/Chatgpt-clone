'use client';

import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

interface ImageOCRProps {
  imageFile: File | string;
  onTextExtracted: (text: string, metadata?: any) => void;
  onError: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export function ImageOCR({ imageFile, onTextExtracted, onError, onProgress }: ImageOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImage = useCallback(async () => {
    if (!imageFile) {
      onError('No image file provided');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('Starting OCR processing on client side...');
      
      // Create worker with English language support
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          console.log('OCR Progress:', m);
          if (m.status === 'recognizing text') {
            const progressValue = Math.round(m.progress * 100);
            setProgress(progressValue);
            onProgress?.(progressValue);
          }
        },
      });

      // Process the image
      const result = await worker.recognize(imageFile);
      
      // Terminate the worker
      await worker.terminate();
      
      console.log('OCR completed successfully');
      console.log('Extracted text:', result.data.text);
      
      // Call the callback with extracted text and metadata
      onTextExtracted(result.data.text, {
        confidence: result.data.confidence,
        type: 'image',
      });
      
    } catch (error) {
      console.error('Error in OCR processing:', error);
      onError(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [imageFile, onTextExtracted, onError, onProgress]);

  return (
    <div className="p-4 border rounded-lg">
      {!isProcessing ? (
        <button
          onClick={processImage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={!imageFile}
        >
          Extract Text from Image
        </button>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Processing image... {progress}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for using OCR functionality
export function useImageOCR() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string>('');

  const processImage = useCallback(async (imageFile: File | string): Promise<string> => {
    setIsProcessing(true);
    setProgress(0);
    setError('');
    setExtractedText('');

    return new Promise(async (resolve, reject) => {
      try {
        console.log('Starting OCR processing...');
        
        const worker = await createWorker('eng', 1, {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              const progressValue = Math.round(m.progress * 100);
              setProgress(progressValue);
            }
          },
        });

        const result = await worker.recognize(imageFile);
        await worker.terminate();
        
        const text = result.data.text.trim();
        setExtractedText(text);
        resolve(text);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        reject(new Error(errorMessage));
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    });
  }, []);

  return {
    processImage,
    isProcessing,
    progress,
    extractedText,
    error,
  };
}