'use client';

import { useState } from 'react';
import { User, Bot, Copy, Check, ThumbsUp, ThumbsDown, Upload, RotateCcw, MoreHorizontal, Edit, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';


interface MessageProps {
  message: {
    _id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
  };
  isStreaming?: boolean;
  isNewMessage?: boolean;
  onResendMessage?: (content: string) => void;
}

export default function MessageComponent({ message, isStreaming = false, isNewMessage = false, onResendMessage }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isUser = message.role === 'user';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleEditSave = () => {
    if (editContent.trim() && onResendMessage) {
      onResendMessage(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const highlightSQL = (code: string) => {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'LIKE', 'UPDATE', 'SET', 'INSERT', 'INTO', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'DATABASE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'UNION', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'IS', 'NULL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'WHILE', 'FOR', 'LOOP', 'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'GRANT', 'REVOKE', 'PRIVILEGES', 'SCHEMA', 'CONSTRAINT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT', 'AUTO_INCREMENT', 'IDENTITY', 'SEQUENCE', 'TRIGGER', 'CASCADE', 'RESTRICT', 'NO', 'ACTION', 'SET', 'NULL', 'NOT', 'NULL', 'UNIQUE', 'INDEX', 'CLUSTERED', 'NONCLUSTERED', 'ASC', 'DESC', 'TOP', 'LIMIT', 'OFFSET', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'WITH', 'TIES', 'PERCENT', 'OVER', 'PARTITION', 'RANK', 'DENSE_RANK', 'ROW_NUMBER', 'LEAD', 'LAG', 'FIRST_VALUE', 'LAST_VALUE', 'NTILE', 'CUME_DIST', 'PERCENT_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTILE', 'CUME_DIST', 'PERCENT_RANK'];
    
    const highlightedCode = code.replace(
      new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi'),
      '<span class="keyword">$1</span>'
    ).replace(
      /'([^']*)'/g,
      '<span class="string">\'$1\'</span>'
    );
    
    return highlightedCode;
  };

  const formatContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);
    
    return parts.map((part, index) => {
      if (index % 3 === 0) {
        const inlineCodeRegex = /`([^`]+)`/g;
        const textParts = part.split(inlineCodeRegex);
        
        return textParts.map((textPart, textIndex) => {
          if (textIndex % 2 === 1) {
            return (
              <code key={textIndex} className="bg-[#3e3e3e] text-white px-1.5 py-0.5 rounded text-sm font-mono">
                {textPart}
              </code>
            );
          }
          return textPart.split('\n').map((line, lineIndex) => (
            <span key={`${textIndex}-${lineIndex}`}>
              {line}
              {lineIndex < textPart.split('\n').length - 1 && <br />}
            </span>
          ));
        });
      } else if (index % 3 === 1) {
        return null;
      } else {
        const language = parts[index - 1] || '';
        const highlightedCode = language.toLowerCase() === 'sql' ? highlightSQL(part) : part;
        
        return (
          <div key={index} className="relative my-4">
            <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-[#3e3e3e]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3e3e3e]">
                <span className="text-xs text-gray-400 font-mono">{language}</span>
                <button
                  onClick={() => copyToClipboard()}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy code'}
                </button>
              </div>
              <div className="p-4">
                <pre className="text-sm font-mono text-white overflow-x-auto">
                  <code 
                    className="sql-highlight" 
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </pre>
              </div>
            </div>
          </div>
        );
      }
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[80%]">
          <div className="bg-[#2f2f2f] rounded-2xl px-4 py-3">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-white text-base leading-relaxed font-sans border-none outline-none resize-none min-h-[24px]"
                autoFocus
                rows={editContent.split('\n').length}
              />
            ) : (
              <div className="text-white text-base leading-relaxed font-sans">
                {message.content}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 mt-2 justify-end">
            {isEditing ? (
              <>
                <button 
                  onClick={handleEditSave}
                  className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors"
                  disabled={!editContent.trim()}
                >
                  <Check size={16} />
                </button>
                <button 
                  onClick={handleEditCancel}
                  className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className=" rounded-2xl px-4 py-3">
        <div className="text-white text-base leading-relaxed font-sans">
          <div className="whitespace-pre-wrap break-words">
            {formatContent(message.content)}
          </div>
        </div>
      </div>

      {message.content && (
        <div className="flex items-center gap-1 mt-2 ml-2">
          <button 
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors">
            <ThumbsUp size={16} />
          </button>
          <button className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors">
            <ThumbsDown size={16} />
          </button>
          <button className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors">
            <Upload size={16} />
          </button>
          <button className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors">
            <RotateCcw size={16} />
          </button>
          <button className="p-1.5 hover:bg-[#3f3f3f] rounded text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      )}
    </div>
  );
}