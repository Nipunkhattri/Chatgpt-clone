"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { SignIn } from "@clerk/nextjs"
import { X } from "lucide-react"

export default function WelcomeScreen() {
  const [showSignIn, setShowSignIn] = useState(false)
  const [input, setInput] = useState("")

  useEffect(() => {
    const handlePopState = () => {
      if (showSignIn) {
        setShowSignIn(false)
        setInput("")
      }
    }

    if (showSignIn) {
      window.history.pushState(null, "", window.location.href)
      window.addEventListener("popstate", handlePopState)
    }

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [showSignIn])

  const handleInputFocus = () => setShowSignIn(true)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value) setShowSignIn(true)
    setInput(e.target.value)
  }

  const handleCloseSignIn = () => {
    setShowSignIn(false)
    setInput("")
    if (window.history.length > 1) window.history.back()
  }

  if (showSignIn) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center relative px-4">
        <button
          onClick={handleCloseSignIn}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-md transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="w-full max-w-sm sm:max-w-md mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-3 mx-auto">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1">Welcome to ChatGPT</h1>
            <p className="text-gray-400 text-xs sm:text-sm">Sign in to continue your conversation</p>
          </div>

          <SignIn
            forceRedirectUrl="/"
            fallbackRedirectUrl="/"
            signUpForceRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-white hover:bg-gray-100 text-black text-sm normal-case font-medium",
                card: "bg-[#2f2f2f] border border-[#4f4f4f] shadow-xl",
                headerTitle: "text-white text-lg sm:text-xl",
                headerSubtitle: "text-gray-400 text-sm",
                socialButtonsIconButton:
                  "border-[#4f4f4f] hover:bg-[#3f3f3f] text-white",
                formFieldInput:
                  "bg-[#1a1a1a] border-[#4f4f4f] text-white placeholder-gray-500",
                formFieldLabel: "text-gray-300 text-sm",
                footerActionLink: "text-blue-400 hover:text-blue-300",
                formFieldHintText: "text-gray-400",
                dividerLine: "bg-[#4f4f4f]",
                dividerText: "text-gray-400 text-xs",
                formFieldErrorText: "text-red-400 text-sm",
                identityPreviewText: "text-white",
                formButtonReset: "text-gray-400 hover:text-white",
              },
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#212121] flex flex-col relative">
      <div className="absolute top-3 right-3 flex items-center gap-2 sm:gap-3 z-10">
        <button
          onClick={() => setShowSignIn(true)}
          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-black rounded-full transition-colors text-xs sm:text-sm font-normal border border-gray-300 cursor-pointer"
        >
          Log in
        </button>
        <button
          onClick={() => setShowSignIn(true)}
          className="px-2 sm:px-3 py-1 sm:py-1.5 text-white rounded-full transition-colors text-xs sm:text-sm font-medium border border-gray cursor-pointer"
        >
          Sign up for free
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">ChatGPT</h1>
        </div>

        <div className="w-full max-w-3xl mx-auto">
          <div className="relative bg-[#2b2b2b] rounded-[20px] sm:rounded-[24px] border border-[#3a3a3a]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center px-3 sm:px-4 py-3 sm:py-4 gap-3 sm:gap-0">
              <div className="flex-1 flex flex-col w-full">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  placeholder="Ask anything"
                  className="w-full bg-transparent resize-none border-0 outline-none text-white placeholder-[#9a9aa3] text-sm sm:text-base leading-6 min-h-[24px] max-h-[160px] font-normal mb-3 sm:mb-4"
                  rows={1}
                />

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    {
                      label: "Attach",
                      icon: (
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      ),
                    },
                    {
                      label: "Search",
                      icon: (
                        <>
                          <circle cx="11" cy="11" r="8" />
                          <path d="M21 21l-4.35-4.35" />
                        </>
                      ),
                    },
                    {
                      label: "Study",
                      icon: (
                        <>
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </>
                      ),
                    },
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={handleInputFocus}
                      className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 cursor-pointer hover:bg-[#444444] border border-[#4b4b4b] rounded-[18px] transition-colors text-xs sm:text-sm text-[#d1d5db] font-medium"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        {btn.icon}
                      </svg>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:ml-4 sm:mt-10 mt-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleInputFocus}
                  className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-2 sm:px-3 py-1.5 cursor-pointer bg-[#444444] border border-[#4b4b4b] rounded-[18px] transition-colors text-xs sm:text-sm text-[#d1d5db] font-medium"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  Voice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="px-3 sm:px-4 py-3 sm:py-4 text-center">
        <p className="text-[10px] sm:text-[11px] text-[#8b8b96]">
          By messaging ChatGPT, you agree to our{" "}
          <span className="underline cursor-pointer hover:text-gray-400">Terms</span> and have read our{" "}
          <span className="underline cursor-pointer hover:text-gray-400">Privacy Policy</span>.{" "}
          <span className="underline cursor-pointer hover:text-gray-400">See Cookie Preferences</span>.
        </p>
      </footer>
    </div>
  )
}