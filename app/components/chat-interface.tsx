'use client';

import { useState, useEffect, useRef } from 'react';
import { IMessage } from '@/app/lib/models';
import { 
  Menu, Send, Square, Plus, Mic, Volume2, Upload, Share, 
  MoreHorizontal, ChevronDown, X, FileText, Image, File as FileIcon,
  Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import MessageComponent from '@/app/components/message';
import ThinkingDots from '@/app/components/thinking-dots';
import SkeletonLoader from '@/app/components/skeleton-loader';
import { useImageOCR } from '@/app/components/image-ocr';
import { CircularProgress, UploadProgressIndicator } from '@/app/components/circular-progress';

interface UIMessage {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  isNew?: boolean;
}

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'uploaded';
  requiresClientOCR?: boolean;
}

interface ChatInterfaceProps {
  chatId: string | null;
  onChatTitleUpdate: (title: string) => void;
  onToggleSidebar: () => void;
  onChatListRefresh?: () => void;
  isChatLoading?: boolean;
  onChatLoadingComplete?: () => void;
}

export default function ChatInterface({
  chatId,
  onChatTitleUpdate,
  onToggleSidebar,
  onChatListRefresh,
  isChatLoading = false,
  onChatLoadingComplete,
}: ChatInterfaceProps) {
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{id: string, name: string, size: number, progress: number}[]>([]);
  const [deletingFiles, setDeletingFiles] = useState<string[]>([]);
  const [processingOCR, setProcessingOCR] = useState<string[]>([]);
  const [ocrProgress, setOcrProgress] = useState<Record<string, number>>({});
  const [fileInputKey, setFileInputKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processImage, isProcessing: isOCRProcessing } = useImageOCR();

  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (chatId) {
      loadChatMessages();
      loadChatFiles();
    } else {
      setAiMessages([]);
      setUploadedFiles([]);
      onChatLoadingComplete?.();
    }
    setUploadingFiles([]);
    setDeletingFiles([]);
    setError(null);
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [aiMessages.length]);

  useEffect(() => {
    const processingFiles = uploadedFiles.filter(f => f.status === 'processing');
    
    if (processingFiles.length > 0) {
      const interval = setInterval(async () => {
        for (const file of processingFiles) {
          try {
            const response = await fetch(`/api/upload?fileId=${file.id}`);
            if (response.ok) {
              const data = await response.json();
              setUploadedFiles(prev => 
                prev.map(f => f.id === file.id ? { ...f, status: data.file.status } : f)
              );
            }
          } catch (error) {
            console.error('Error checking file status:', error);
          }
        }
      }, 2000); 

      return () => clearInterval(interval);
    }
  }, [uploadedFiles]);

  const loadChatMessages = async () => {
    if (!chatId) return;
    
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (response.ok) {
        const chatMessages: IMessage[] = await response.json();
        const aiSdkMessages = chatMessages.map(msg => ({
          id: msg._id?.toString() || '',
          role: msg.role as 'user' | 'assistant' | 'system',
          parts: [{ type: 'text' as const, text: msg.content }],
        }));
        setAiMessages(aiSdkMessages);
      } else {
        console.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
      onChatLoadingComplete?.();
    }
  };

  const loadChatFiles = async () => {
    if (!chatId) return;
    
    try {
      const response = await fetch(`/api/upload?chatId=${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data.files.map((file: any) => ({
          id: file._id,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          url: file.cloudinaryUrl,
          status: file.status,
        })));
      }
    } catch (error) {
      console.error('Error loading chat files:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || aiMessages.length === 0) {
      setShowScrollToBottom(false);
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setShowScrollToBottom(!isAtBottom);
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Force re-render of the input element by changing its key
    setFileInputKey(prev => prev + 1);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
        
    const fileArray = Array.from(files);
    const tempUploadingFiles = fileArray.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      progress: 0
    }));
    
    setUploadingFiles(prev => [...prev, ...tempUploadingFiles]);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const tempId = tempUploadingFiles[i].id;
      const formData = new FormData();
      formData.append('file', file);
      if (chatId) {
        formData.append('chatId', chatId);
      }

      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Track upload progress
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadingFiles(prev => 
                prev.map(f => 
                  f.id === tempId ? { ...f, progress } : f
                )
              );
            }
          });

          // Handle completion
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                const newFile: UploadedFile = {
                  id: data.file.id,
                  fileName: data.file.fileName,
                  fileType: data.file.fileType,
                  fileSize: data.file.fileSize,
                  url: data.file.url,
                  status: data.file.status,
                  requiresClientOCR: data.file.requiresClientOCR,
                };
                
                setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
                setUploadedFiles(prev => [...prev, newFile]);

                // If it's an image that requires client-side OCR, start processing
                if (data.file.requiresClientOCR) {
                  handleImageOCR(newFile);
                }
                
                resolve();
              } catch (parseError) {
                console.error('Error parsing response:', parseError);
                reject(new Error('Failed to parse server response'));
              }
            } else {
              console.error('Upload failed with status:', xhr.status);
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
          });

          // Handle errors
          xhr.addEventListener('error', () => {
            console.error('Network error during upload');
            reject(new Error('Network error during upload'));
          });

          // Handle timeout
          xhr.addEventListener('timeout', () => {
            console.error('Upload timeout');
            reject(new Error('Upload timeout'));
          });

          // Start the upload
          xhr.open('POST', '/api/upload');
          xhr.timeout = 60000; // 60 seconds timeout
          xhr.send(formData);
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        setError(error instanceof Error ? error : new Error('Upload failed'));
        setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
      }
    }

    // Clear the file input after all uploads are complete
    clearFileInput();
  };

  const handleFileDelete = async (fileId: string) => {
    setDeletingFiles(prev => [...prev, fileId]);
    setError(null);

    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
        setDeletingFiles(prev => prev.filter(id => id !== fileId));
        // Clear the file input to allow re-uploading the same file
        clearFileInput();
      } else {
        console.error('Failed to delete file');
        setError(new Error('Failed to delete file. Please try again.'));
        setDeletingFiles(prev => prev.filter(id => id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(error instanceof Error ? error : new Error('An error occurred while deleting the file.'));
      setDeletingFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  const handleImageOCR = async (file: UploadedFile) => {
    try {
      setProcessingOCR(prev => [...prev, file.id]);
      setOcrProgress(prev => ({ ...prev, [file.id]: 0 }));
      
      // Update file status to processing
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing' }
            : f
        )
      );

      // Process the image with OCR - create a custom progress tracking wrapper
      const extractedText = await new Promise<string>((resolve, reject) => {
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress = Math.min(progress + Math.random() * 15, 90);
          setOcrProgress(prev => ({ ...prev, [file.id]: Math.round(progress) }));
        }, 200);

        processImage(file.url)
          .then((text) => {
            clearInterval(progressInterval);
            setOcrProgress(prev => ({ ...prev, [file.id]: 100 }));
            setTimeout(() => resolve(text), 300); // Brief delay to show 100%
          })
          .catch((error) => {
            clearInterval(progressInterval);
            reject(error);
          });
      });
      
      // Check if any text was extracted
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the image');
      }
      
      // Send the extracted text to the server
      const response = await fetch('/api/process-ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
          extractedText: extractedText.trim(),
          metadata: {
            type: 'image',
            fileName: file.fileName,
          },
        }),
      });

      if (response.ok) {
        // Update file status to completed
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'completed', requiresClientOCR: false }
              : f
          )
        );
      } else {
        throw new Error('Failed to process extracted text');
      }
      
    } catch (error) {
      console.error('Error processing image OCR:', error);
      setError(error instanceof Error ? error : new Error('Failed to process image'));
      
      // Update file status to failed
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'failed' }
            : f
        )
      );
    } finally {
      setProcessingOCR(prev => prev.filter(id => id !== file.id));
      setOcrProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.id];
        return newProgress;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
      // Clear the file input to allow re-uploading the same files
      clearFileInput();
    }
  };

  const sendMessage = async (messageContent: string) => {
    setIsLoading(true);
    setError(null);

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      parts: [{ type: 'text' as const, text: messageContent }],
    };

    setAiMessages(prev => [...prev, userMessage]);

    try {
      const messagesToSend = [...aiMessages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join(''),
      }));

      const completedFileIds = uploadedFiles
        .filter(f => f.status === 'completed')
        .map(f => f.id);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
          chatId: chatId,
          fileIds: completedFileIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      if (data.filesProcessing) {
        const assistantMessage = {
          id: data.message.id,
          role: 'assistant' as const,
          parts: [{ type: 'text' as const, text: data.message.content }],
        };
        setAiMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage = {
          id: data.message.id,
          role: 'assistant' as const,
          parts: [{ type: 'text' as const, text: data.message.content }],
        };

        setAiMessages(prev => [...prev, assistantMessage]);

        if (aiMessages.length === 0 && onChatListRefresh) {
          onChatListRefresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputValue = input.trim();
    
    if (!inputValue || isLoading) {
      return;
    }
    
    sendMessage(inputValue);
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image size={16} />;
    if (fileType.includes('pdf')) return <FileText size={16} />;
    return <FileIcon size={16} />;
  };

  const getStatusIcon = (status: string, fileId?: string) => {
    const isProcessingOCRFile = fileId && processingOCR.includes(fileId);
    const currentOcrProgress = fileId ? ocrProgress[fileId] || 0 : 0;
    
    if (isProcessingOCRFile) {
      return (
        <div className="flex items-center gap-2">
          <CircularProgress 
            progress={currentOcrProgress} 
            size={24} 
            strokeWidth={2}
          />
          {/* <span className="text-orange-400 text-xs font-medium">
            OCR {currentOcrProgress}%
          </span> */}
        </div>
      );
    }
    
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 size={14} className="animate-spin text-blue-400" />;
      case 'uploaded':
        return (
          <div className="flex items-center gap-1">
            <CheckCircle size={12} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs font-medium">
              Ready for OCR
            </span>
          </div>
        );
      case 'completed':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'failed':
        return <AlertCircle size={14} className="text-red-400" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#212121]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-[#2f2f2f] rounded-lg p-8 border-2 border-blue-500 border-dashed">
            <Upload size={48} className="text-blue-500 mb-4 mx-auto" />
            <p className="text-white text-lg">Drop files here to upload</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-4 border-b border-[#2f2f2f]">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-[#2f2f2f] rounded-md text-gray-300 hover:text-white transition-colors"
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-semibold text-white">
            {chatId ? 'Chat' : 'New Chat'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {aiMessages.length > 0 && (
            <>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#2f2f2f] rounded-md transition-colors">
                <Share size={16} />
                Share
              </button>
              <button className="p-2 hover:bg-[#2f2f2f] rounded-md transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative">
        {(isLoadingMessages || isChatLoading) ? (
          <SkeletonLoader type="chat" count={4} />
        ) : aiMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl font-semibold text-white mb-8">
                What can I help with?
              </h1>
              
              <div className="flex justify-center mb-12">
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all font-medium">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                  Upgrade to Go
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {aiMessages.map((message, index) => {
              const textContent = message.parts
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text)
                .join('');
              
              const uiMessage: UIMessage = {
                _id: message.id,
                role: message.role,
                content: textContent,
                createdAt: new Date(),
                isNew: false
              };
              
              return (
                <MessageComponent
                  key={message.id}
                  message={uiMessage}
                  isStreaming={false}
                  isNewMessage={false}
                  onResendMessage={sendMessage}
                />
              );
            })}
            
            {isLoading && <ThinkingDots />}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {showScrollToBottom && (
        <div className="fixed bottom-40 left-1/2 transform -translate-x-1/3 z-20 w-full max-w-4xl mx-auto px-4">
          <div className="flex justify-center">
            <button
              onClick={scrollToBottom}
              className="scroll-to-bottom-btn p-2 rounded-full transition-all duration-200"
            >
              <ChevronDown size={16} className="text-gray-300" />
            </button>
          </div>
        </div>
      )}

      <div className="p-4 pb-6">
        {(uploadedFiles.length > 0 || uploadingFiles.length > 0) && (
          <div className="mb-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {uploadingFiles.map((file) => (
                  <UploadProgressIndicator
                    key={file.id}
                    fileName={file.name}
                    progress={file.progress}
                    isCompleted={file.progress >= 100}
                  />
                ))}
                
                {uploadedFiles.map((file) => {
                  const isDeleting = deletingFiles.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      className={cn(
                        "flex items-center gap-2 bg-[#2f2f2f] rounded-lg px-3 py-2 text-sm",
                        isDeleting && "opacity-60 animate-pulse border border-red-500/30"
                      )}
                    >
                      {getFileIcon(file.fileType)}
                      <span className="text-gray-300 max-w-[150px] truncate">
                        {file.fileName}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatFileSize(file.fileSize)}
                      </span>
                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin text-red-400" />
                          <span className="text-red-400 text-xs font-medium">
                            Deleting...
                          </span>
                        </div>
                      ) : (
                        getStatusIcon(file.status, file.id)
                      )}
                      
                      {/* OCR button for uploaded images */}
                      {file.status === 'uploaded' && file.requiresClientOCR && !processingOCR.includes(file.id) && (
                        <button
                          onClick={() => handleImageOCR(file)}
                          className="ml-1 px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
                          title="Process image text"
                        >
                          Extract Text
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        disabled={isDeleting}
                        className={cn(
                          "ml-1 transition-colors",
                          isDeleting
                            ? "text-gray-600 cursor-not-allowed"
                            : "text-gray-400 hover:text-white"
                        )}
                        title={isDeleting ? "Deleting..." : "Delete file"}
                      >
                        {isDeleting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto">
          <div className="chatgpt-input relative flex items-center">
            <input
              key={fileInputKey}
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png,.gif"
            />
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-2 text-gray-300 hover:text-white hover:bg-[#3f3f3f] rounded-lg transition-colors ml-2",
                uploadingFiles.length > 0 && "animate-pulse text-blue-400"
              )}
              title={uploadingFiles.length > 0 ? "Files are being uploaded..." : "Upload files"}
            >
              {uploadingFiles.length > 0 ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            </button>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              className="flex-1 bg-transparent resize-none border-0 outline-none text-white placeholder-gray-400 py-4 px-2 max-h-[200px] leading-6 text-base"
              style={{ minHeight: '24px', height: 'auto' }}
              disabled={isLoading}
              rows={1}
            />
            
            <div className="flex items-center pr-2">
              <button
                type="button"
                className="p-2 text-gray-300 hover:text-white hover:bg-[#3f3f3f] rounded-lg transition-colors"
              >
                <Mic size={20} />
              </button>
              <button
                type="button"
                className="p-2 text-gray-300 hover:text-white hover:bg-[#3f3f3f] rounded-lg transition-colors ml-1"
              >
                <Volume2 size={20} />
              </button>
              
              {isLoading ? (
                <button
                  type="button"
                  className="p-2 text-white hover:bg-[#3f3f3f] rounded-lg transition-colors ml-1"
                >
                  <Square size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input?.trim()}
                  className={cn(
                    "p-2 rounded-lg transition-colors ml-1",
                    input?.trim()
                      ? "text-white hover:bg-[#3f3f3f]"
                      : "text-gray-500 cursor-not-allowed"
                  )}
                >
                  <Send size={20} />
                </button>
              )}
            </div>
          </div>
        </form>
        
        {error && (
          <div className="text-red-400 text-sm text-center mb-2">
            Error: {error.message || 'An error occurred'}
          </div>
        )}
        <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
          ChatGPT can make mistakes. Check important info. <span className="underline cursor-pointer hover:text-gray-300">See Cookie Preferences</span>.
        </p>
      </div>
    </div>
  );
}