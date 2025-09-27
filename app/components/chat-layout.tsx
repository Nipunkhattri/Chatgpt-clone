'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { IChat } from '@/app/lib/models';
import Sidebar from './sidebar';
import ChatInterface from './chat-interface';   

export default function ChatLayout() {
  const { user, isLoaded } = useUser();
  const [chats, setChats] = useState<IChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      loadChats();
    }
  }, [isLoaded, user]);

  const loadChats = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const userChats = await response.json();
        setChats(userChats);
        
        if (!currentChatId && userChats.length > 0) {
          setCurrentChatId(userChats[0]._id);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Chat' }),
      });

      if (response.ok) {
        const newChat = await response.json();
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat._id);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChats(prev => prev.filter(chat => chat._id !== chatId));
        
        if (currentChatId === chatId) {
          const remainingChats = chats.filter(chat => chat._id !== chatId);
          setCurrentChatId(remainingChats.length > 0 ? remainingChats[0]._id : null);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const updatedChat = await response.json();
        setChats(prev => 
          prev.map(chat => 
            chat._id === chatId ? updatedChat : chat
          )
        );
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <div className="w-4 h-4 bg-white rounded-sm animate-pulse"></div>
          </div>
          <div className="text-white text-lg font-medium mb-2">ChatGPT</div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse loading-dot"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse loading-dot"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse loading-dot"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#212121] text-white">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onUpdateChatTitle={updateChatTitle}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <main className="flex-1 flex flex-col">
        <ChatInterface
          chatId={currentChatId}
          onChatTitleUpdate={(title: string) => {
            if (currentChatId) {
              updateChatTitle(currentChatId, title);
            }
          }}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onChatListRefresh={loadChats}
        />
      </main>
    </div>
  );
}