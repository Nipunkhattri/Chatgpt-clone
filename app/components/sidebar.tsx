'use client';

import { useState } from 'react';
import { UserButton, useClerk } from '@clerk/nextjs';
import { IChat } from '@/app/lib/models';
import { 
  MessageSquarePlus, 
  Menu, 
  X, 
  Trash2, 
  Edit3, 
  Check, 
  XIcon,
  Search,
  BookOpen,
  Play,
  Grid3X3,
  Folder,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Brain,
  LogOut
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import ConfirmDialog from './confirm-dialog';
import { validateChatTitle } from '@/app/lib/chat-utils';

interface SidebarProps {
  chats: IChat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, title: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onUpdateChatTitle,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirmChat, setDeleteConfirmChat] = useState<IChat | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { signOut } = useClerk();

  const startEditing = (chat: IChat) => {
    setEditingChatId(chat._id);
    setEditingTitle(chat.title);
    setTitleError(null);
  };

  const saveTitle = () => {
    if (!editingChatId) return;
    
    const validatedTitle = validateChatTitle(editingTitle);
    
    if (!validatedTitle) {
      if (!editingTitle.trim()) {
        setTitleError('Title cannot be empty');
      } else if (editingTitle.trim().length > 100) {
        setTitleError('Title is too long (max 100 characters)');
      } else {
        setTitleError('Invalid title');
      }
      return;
    }
    
    onUpdateChatTitle(editingChatId, validatedTitle);
    setEditingChatId(null);
    setEditingTitle('');
    setTitleError(null);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingTitle('');
    setTitleError(null);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
    setTitleError(null); 
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleDeleteClick = (chat: IChat, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmChat(chat);
  };

  const confirmDelete = () => {
    if (deleteConfirmChat) {
      onDeleteChat(deleteConfirmChat._id);
      setDeleteConfirmChat(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmChat(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      <div
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 w-64 bg-[#171717] border-r border-[#2f2f2f] transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                <span className="text-white font-semibold text-sm">ChatGPT</span>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
              <button
                onClick={onToggle}
                className="md:hidden p-1 text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-2 p-2.5 bg-[#2f2f2f] hover:bg-[#3f3f3f] rounded-lg transition-colors text-white text-sm"
            >
              <Plus size={16} />
              New chat
            </button>
          </div>

          <div className="px-3 mb-4">
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-300 text-sm">
                <Search size={16} />
                Search chats
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-300 text-sm">
                <BookOpen size={16} />
                Library
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-300 text-sm">
                <Play size={16} />
                Sora
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-300 text-sm">
                <Grid3X3 size={16} />
                GPTs
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-300 text-sm relative">
                <Folder size={16} />
                Projects
                <span className="absolute right-2 bg-green-500 text-black text-xs px-1.5 py-0.5 rounded text-[10px] font-medium">
                  NEW
                </span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3">
            <div className="text-xs text-gray-400 mb-2 font-medium">Chats</div>
            {chats.length === 0 ? (
              <div className="space-y-1">
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat._id}
                    className={cn(
                      "group relative flex items-center p-2 rounded-lg cursor-pointer transition-colors",
                      currentChatId === chat._id 
                        ? "bg-[#2f2f2f]" 
                        : "hover:bg-[#2f2f2f]"
                    )}
                    onClick={() => onChatSelect(chat._id)}
                  >
                    <div className="flex-1 min-w-0">
                      {editingChatId === chat._id ? (
                        <div className="w-full">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={handleTitleChange}
                            onKeyDown={handleKeyPress}
                            onBlur={saveTitle}
                            className={cn(
                              "w-full bg-[#3f3f3f] border rounded px-2 py-1 text-sm text-white focus:outline-none",
                              titleError ? "border-red-500 focus:border-red-500" : "border-[#4f4f4f] focus:border-blue-500"
                            )}
                            autoFocus
                            maxLength={100}
                            placeholder="Enter chat title..."
                          />
                          {titleError && (
                            <div className="text-red-400 text-xs mt-1 px-2">
                              {titleError}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300 truncate">{chat.title}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingChatId === chat._id ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveTitle();
                            }}
                            className="p-1 hover:bg-[#3f3f3f] rounded"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing();
                            }}
                            className="p-1 hover:bg-[#3f3f3f] rounded"
                          >
                            <XIcon size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(chat);
                            }}
                            className="p-1 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(chat, e)}
                            className="p-1 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#2f2f2f]">
            <div className="flex items-center gap-3 p-2 hover:bg-[#2f2f2f] rounded-lg mb-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-semibold text-sm">
                N
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">21IT022Nipun...</p>
                <p className="text-xs text-gray-400">Free</p>
              </div>
              <button className="px-3 py-1.5 bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white text-xs rounded-md transition-colors">
                Upgrade
              </button>
            </div>
            
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-2 p-2 hover:bg-[#2f2f2f] rounded-lg text-gray-300 hover:text-white text-sm transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmChat !== null}
        title="Delete Chat"
        message={`Are you sure you want to delete "${deleteConfirmChat?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDangerous={true}
      />
    
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign out"
        message="Are you sure you want to sign out? You'll need to sign in again to continue using ChatGPT."
        confirmText="Sign out"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
        isDangerous={false}
      />
    </>
  );
}