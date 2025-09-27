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
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

interface ChatInterfaceProps {
  chatId: string | null;
  onChatTitleUpdate: (title: string) => void;
  onToggleSidebar: () => void;
  onChatListRefresh?: () => void;
}

export default function ChatInterface({
  chatId,
  onChatTitleUpdate,
  onToggleSidebar,
  onChatListRefresh,
}: ChatInterfaceProps) {
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{id: string, name: string, size: number}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
    setUploadingFiles([]);
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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
        
    const fileArray = Array.from(files);
    const tempUploadingFiles = fileArray.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size
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
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const newFile: UploadedFile = {
            id: data.file.id,
            fileName: data.file.fileName,
            fileType: data.file.fileType,
            fileSize: data.file.fileSize,
            url: data.file.url,
            status: 'processing',
          };
          
          setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
          setUploadedFiles(prev => [...prev, newFile]);
        } else {
          console.error('Failed to upload file');
          setError(new Error('Failed to upload file'));
          setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setError(error instanceof Error ? error : new Error('Upload failed'));
        setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
      }
    }
  };

  const handleFileDelete = async (fileId: string) => {
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
      } else {
        console.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 size={14} className="animate-spin text-blue-400" />;
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
          className="p-2 hover:bg-[#2f2f2f] rounded-md"
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
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading messages...</div>
          </div>
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
                  <div
                    key={file.id}
                    className="flex items-center gap-2 bg-[#2f2f2f] rounded-lg px-3 py-2 text-sm border border-blue-500/30 animate-pulse"
                  >
                    <Loader2 size={16} className="animate-spin text-blue-400" />
                    <span className="text-gray-300 max-w-[150px] truncate">
                      {file.name}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatFileSize(file.size)}
                    </span>
                    <span className="text-blue-400 text-xs font-medium">
                      Uploading...
                    </span>
                  </div>
                ))}
                
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 bg-[#2f2f2f] rounded-lg px-3 py-2 text-sm"
                  >
                    {getFileIcon(file.fileType)}
                    <span className="text-gray-300 max-w-[150px] truncate">
                      {file.fileName}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatFileSize(file.fileSize)}
                    </span>
                    {getStatusIcon(file.status)}
                    <button
                      onClick={() => handleFileDelete(file.id)}
                      className="ml-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto">
          <div className="chatgpt-input relative flex items-center">
            <input
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