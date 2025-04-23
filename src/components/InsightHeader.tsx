'use client';

import { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface InsightHeaderProps {
  insight?: string;
  onChatOpen: () => void;
}

export default function InsightHeader({ 
  insight = 'Discover insights from your music journey...', 
  onChatOpen 
}: InsightHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`w-full transition-all duration-500 ease-in-out mb-6 relative z-[1] ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
      }`}
    >
      <div className="bg-white shadow-md rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-purple-700 font-medium text-lg">{insight}</p>
          </div>
          <button
            onClick={onChatOpen}
            className="ml-4 bg-purple-600 hover:bg-purple-500 transition-colors px-4 py-2 rounded-xl flex items-center text-white shadow-lg"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            <span>Tell me more</span>
          </button>
        </div>
      </div>
    </div>
  );
} 