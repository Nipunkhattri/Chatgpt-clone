'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { IChat } from '@/app/lib/models';
import Sidebar from './sidebar';
import ChatInterface from './chat-interface';
import WelcomeScreen from './welcome-screen';   

interface ChatLayoutProps {
  initialChatId?: string;
}

export default function ChatLayout({ initialChatId }: ChatLayoutProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const [chats, setChats] = useState<IChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoChats, setHasNoChats] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktop = window.innerWidth >= 768;
      setSidebarOpen(isDesktop);
    };

    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      loadChats();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const newChatId = params?.chatId as string;
    if (newChatId && newChatId !== currentChatId) {
      setIsChatLoading(true);
      setCurrentChatId(newChatId);
    }
  }, [params?.chatId, currentChatId]);

  const loadChats = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const userChats = await response.json();
        setChats(userChats);
        
        if (userChats.length === 0) {
          setHasNoChats(true);
          setCurrentChatId(null);
        } else {
          setHasNoChats(false);
          
          if (initialChatId) {
            const chatExists = userChats.some((chat: IChat) => chat._id === initialChatId);
            if (chatExists) {
              setCurrentChatId(initialChatId);
            } else {
              router.replace(`/chat/${userChats[0]._id}`);
              return;
            }
          } else if (!initialChatId) {
            router.replace(`/chat/${userChats[0]._id}`);
            return;
          }
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
      setIsChatLoading(true); 
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
        router.push(`/chat/${newChat._id}`);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      setIsChatLoading(false); 
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedChats = chats.filter(chat => chat._id !== chatId);
        setChats(updatedChats);
        
        if (currentChatId === chatId) {
          if (updatedChats.length > 0) {
            router.push(`/chat/${updatedChats[0]._id}`);
          } else {
            router.push('/');
          }
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

  const handleChatSelect = (chatId: string) => {
    if (chatId !== currentChatId) {
      setIsChatLoading(true);
    }
    router.push(`/chat/${chatId}`);
  };

  if (!isLoaded) {
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
        onChatSelect={handleChatSelect}
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
          isChatLoading={isChatLoading}
          onChatLoadingComplete={() => setIsChatLoading(false)}
        />
      </main>
    </div>
  );
}