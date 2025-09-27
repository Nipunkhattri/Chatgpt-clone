'use client';

import { useState, useEffect } from 'react';
import { SignIn } from '@clerk/nextjs';
import { X } from 'lucide-react';

export default function WelcomeScreen() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      if (showSignIn) {
        setShowSignIn(false);
        setInput('');
      }
    };

    if (showSignIn) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showSignIn]);

  const handleInputFocus = () => {
    setShowSignIn(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value) {
      setShowSignIn(true);
    }
    setInput(e.target.value);
  };

  const handleCloseSignIn = () => {
    setShowSignIn(false);
    setInput('');
    // Go back in history to prevent forward navigation issues
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  if (showSignIn) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center relative">
        <button
          onClick={handleCloseSignIn}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-md transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome to ChatGPT</h1>
            <p className="text-gray-400 text-sm">Sign in to continue your conversation</p>
          </div>
          
          <SignIn 
            forceRedirectUrl="/"
            fallbackRedirectUrl="/"
            signUpForceRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-white hover:bg-gray-100 text-black text-sm normal-case font-medium',
                card: 'bg-[#2f2f2f] border border-[#4f4f4f] shadow-xl',
                headerTitle: 'text-white text-xl',
                headerSubtitle: 'text-gray-400',
                socialButtonsIconButton: 'border-[#4f4f4f] hover:bg-[#3f3f3f] text-white',
                formFieldInput: 'bg-[#1a1a1a] border-[#4f4f4f] text-white placeholder-gray-500',
                formFieldLabel: 'text-gray-300',
                footerActionLink: 'text-blue-400 hover:text-blue-300',
                formFieldHintText: 'text-gray-400',
                dividerLine: 'bg-[#4f4f4f]',
                dividerText: 'text-gray-400',
                formFieldErrorText: 'text-red-400',
                identityPreviewText: 'text-white',
                formButtonReset: 'text-gray-400 hover:text-white',
              },
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] flex flex-col relative">
      {/* Header Buttons - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <button 
          onClick={() => setShowSignIn(true)}
          className="px-3 py-1.5 text-white hover:bg-white/10 rounded-md transition-colors text-sm font-normal"
        >
          Log in
        </button>
        <button 
          onClick={() => setShowSignIn(true)}
          className="px-3 py-1.5 bg-white text-black hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
        >
          Sign up for free
        </button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold text-white tracking-tight">ChatGPT</h1>
        </div>

        <div className="w-full max-w-4xl mx-auto">
          <div className="relative bg-[#2f2f2f] rounded-[24px] border border-[#565869] shadow-lg">
            <div className="flex items-center px-6 py-5">
              <div className="flex-1 flex flex-col">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  placeholder="Ask anything"
                  className="w-full bg-transparent resize-none border-0 outline-none text-white placeholder-[#8e8ea0] text-base leading-6 min-h-[24px] max-h-[200px] font-normal mb-3"
                  rows={1}
                />
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInputFocus}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#565869] hover:bg-[#646577] rounded-[18px] transition-colors text-xs text-[#d1d5db] font-medium"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    Attach
                  </button>

                  <button
                    type="button"
                    onClick={handleInputFocus}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#565869] hover:bg-[#646577] rounded-[18px] transition-colors text-xs text-[#d1d5db] font-medium"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    Search
                  </button>

                  <button
                    type="button"
                    onClick={handleInputFocus}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#565869] hover:bg-[#646577] rounded-[18px] transition-colors text-xs text-[#d1d5db] font-medium"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    Study
                  </button>
                </div>
              </div>
              
              <div className="ml-4">
                <button
                  type="button"
                  onClick={handleInputFocus}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#565869] hover:bg-[#646577] rounded-[18px] transition-colors text-xs text-[#d1d5db] font-medium"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                  Voice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[11px] text-gray-500 px-4">
          By messaging ChatGPT, you agree to our{' '}
          <span className="underline cursor-pointer hover:text-gray-400">Terms</span>
          {' '}and have read our{' '}
          <span className="underline cursor-pointer hover:text-gray-400">Privacy Policy</span>
          .{' '}
          <span className="underline cursor-pointer hover:text-gray-400">See Cookie Preferences</span>
          .
        </p>
      </footer>
    </div>
  );
}
