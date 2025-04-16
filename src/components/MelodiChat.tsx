import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

interface MelodiChatProps {
  userName?: string;
  journalEntries?: any[];
  listeningHistory?: any[];
  dateRange?: string;
}

interface ChatMessage {
  sender: 'melodi' | 'user';
  text: string;
}

const MelodiChat: React.FC<MelodiChatProps> = ({
  userName,
  journalEntries = [],
  listeningHistory = [],
  dateRange,
}) => {
  const [greeting, setGreeting] = useState('');
  const [insight, setInsight] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateGreeting();
    generateInsight();
  }, [userName, journalEntries, listeningHistory]);

  useEffect(() => {
    if (isChatOpen && chat.length === 0) {
      fetchMelodiReply([]); // Get opening message from DeepSeek
    }
  }, [isChatOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, isChatOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsChatOpen(false);
      }
    };

    if (isChatOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isChatOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsChatOpen(false);
      }
    };

    if (isChatOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isChatOpen]);

  const generateGreeting = () => {
    const hour = new Date().getHours();
    let timeBasedGreeting = '';
    
    if (hour < 12) timeBasedGreeting = 'Good Morning';
    else if (hour < 17) timeBasedGreeting = 'Good Afternoon';
    else timeBasedGreeting = 'Good Evening';

    const firstName = userName ? userName.split(' ')[0] : '';
    setGreeting(`${timeBasedGreeting}${firstName ? `, ${firstName}` : ''}!`);
  };

  const generateInsight = () => {
    if (journalEntries.length === 0 && listeningHistory.length === 0) {
      setInsight("I'm here to help you track your musical journey and emotions. Why not start by sharing how you're feeling today?");
      return;
    }

    const recentEntry = journalEntries[0];
    const recentTracks = listeningHistory.slice(0, 3);

    if (recentEntry) {
      const mood = recentEntry.mood;
      const date = format(new Date(recentEntry.createdAt), 'EEEE');
      setInsight(`I noticed that on ${date} you were feeling ${mood}. Your music choices often reflect your emotions - let's explore that connection together!`);
    } else if (recentTracks.length > 0) {
      setInsight("I see you've been listening to some great music! Would you like to share how these songs make you feel?");
    }
  };

  // Fetch Melodi's (DeepSeek) reply from the API
  const fetchMelodiReply = async (currentChat: ChatMessage[], userMsg?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/melodi-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat: currentChat,
          journalEntries,
          listeningHistory,
        }),
      });
      const data = await res.json();
      setChat((prev) => [
        ...prev,
        { sender: 'melodi', text: data.message }
      ]);
    } catch (err) {
      setChat((prev) => [
        ...prev,
        { sender: 'melodi', text: 'Sorry, I had trouble thinking of a response.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle user sending a message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const newChat = [...chat, { sender: 'user' as const, text: input }];
    setChat(newChat);
    setInput('');
    await fetchMelodiReply(newChat, input);
  };

  return (
    <>
      {/* Chat widget button */}
      <button
        className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg focus:outline-none z-20 transition-transform hover:scale-105"
        onClick={() => setIsChatOpen(true)}
        aria-label="Open Melodi Chat"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-7 h-7"
        >
          <path 
            fillRule="evenodd" 
            d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {/* Modal backdrop */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" aria-hidden="true" />
      )}

      {/* Chat modal */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-title"
        >
          <div
            ref={modalRef}
            className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] transform transition-all"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <Image
                  src="/melodi-avatar.png"
                  alt="Melodi Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <h2 id="chat-title" className="font-semibold text-lg text-indigo-600">
                    {greeting}
                  </h2>
                  <p className="text-sm text-gray-600">Here to share your musical journey</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close chat"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                      msg.sender === 'melodi'
                        ? 'bg-indigo-100 text-gray-800'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] px-4 py-2 rounded-lg text-sm bg-indigo-100 text-gray-800 animate-pulse">
                    Melodi is thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t p-4">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="What's on your mind?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!input.trim() || loading}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MelodiChat; 