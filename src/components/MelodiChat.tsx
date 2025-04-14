import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

interface MelodiChatProps {
  userName?: string;
  journalEntries?: any[];
  listeningHistory?: any[];
  dateRange?: string;
}

const MelodiChat: React.FC<MelodiChatProps> = ({
  userName,
  journalEntries = [],
  listeningHistory = [],
  dateRange,
}) => {
  const [greeting, setGreeting] = useState('');
  const [insight, setInsight] = useState('');

  useEffect(() => {
    generateGreeting();
    generateInsight();
  }, [userName, journalEntries, listeningHistory]);

  const generateGreeting = () => {
    const hour = new Date().getHours();
    let timeBasedGreeting = '';
    
    if (hour < 12) timeBasedGreeting = 'Good morning';
    else if (hour < 17) timeBasedGreeting = 'Good afternoon';
    else timeBasedGreeting = 'Good evening';

    setGreeting(`${timeBasedGreeting}${userName ? `, ${userName}` : ''}!`);
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <Image
            src="/melodi-avatar.png"
            alt="Melodi Avatar"
            width={48}
            height={48}
            className="rounded-full"
          />
        </div>
        <div className="flex-grow">
          <div className="font-semibold text-lg text-indigo-600 mb-2">
            {greeting}
          </div>
          <p className="text-gray-700">
            {insight}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MelodiChat; 