'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
  moodSummary?: string;
  selectedMood?: string;
}

const moodOptions = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😌", label: "Calm", value: "calm" },
  { emoji: "😔", label: "Sad", value: "sad" },
  { emoji: "😤", label: "Frustrated", value: "frustrated" },
  { emoji: "🤔", label: "Reflective", value: "reflective" },
  { emoji: "✨", label: "Inspired", value: "inspired" },
] as const;

export default function JournalSection() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MIN_CHARS = 50; // Minimum characters for meaningful analysis
  const MAX_CHARS = 2000; // Maximum characters allowed

  useEffect(() => {
    if (session) {
      fetchEntries();
    }
  }, [session]);

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/journal");
      if (!response.ok) throw new Error("Failed to fetch entries");
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    if (newEntry.length < MIN_CHARS) {
      alert(`Please write at least ${MIN_CHARS} characters for meaningful mood analysis.`);
      return;
    }
    if (!selectedMood) {
      alert("Please select a mood for your entry.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: newEntry,
          selectedMood: selectedMood
        }),
      });

      if (!response.ok) throw new Error("Failed to create entry");
      
      const entry = await response.json();
      setEntries([entry, ...entries]);
      setNewEntry("");
      setSelectedMood(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowEntries(true);
    } catch (error) {
      console.error("Error creating entry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initiateDelete = (id: string) => {
    setDeleteConfirmation(id);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/journal/${deleteConfirmation}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete entry");
      
      setEntries(entries.filter(entry => entry.id !== deleteConfirmation));
      if (selectedEntry === deleteConfirmation) {
        setSelectedEntry(null);
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMoodEmoji = (moodValue: string) => {
    return moodOptions.find(m => m.value === moodValue)?.emoji || "📝";
  };

  const getMoodLabel = (moodValue: string) => {
    return moodOptions.find(m => m.value === moodValue)?.label || "Unknown";
  };

  if (!session) {
    return <div>Please sign in to access your journal.</div>;
  }

  if (loading) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Loading journal entries...</div>;
  }

  if (error) {
    return <div className="bg-white p-6 rounded-lg shadow-md">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-outfit font-bold text-white">Mood Journal</h2>
        <button
          onClick={() => setShowEntries(!showEntries)}
          className="px-4 py-2 bg-blue-400/90 text-white rounded-lg hover:bg-blue-500 font-outfit transition-colors duration-200 text-sm backdrop-blur-sm"
        >
          {showEntries ? "Hide Past Entries" : "View Past Entries"}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-8 relative">
        <div className="p-6 backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl shadow-lg">
          <div className="mb-4">
            <label className="block text-white font-outfit mb-2">How are you feeling?</label>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setSelectedMood(mood.value)}
                  className={`px-4 py-2 rounded-lg font-outfit text-lg transition-all duration-200 flex items-center gap-2
                    ${selectedMood === mood.value 
                      ? 'bg-blue-500 text-white scale-105 shadow-md' 
                      : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={newEntry}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                setNewEntry(e.target.value);
              }
            }}
            placeholder="Write more about how you're feeling..."
            className="w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white text-gray-900 font-dm-sans text-lg leading-relaxed shadow-inner"
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-300 font-outfit">
              {newEntry.length < MIN_CHARS && newEntry.length > 0 ? (
                <span className="text-yellow-400">
                  Write at least {MIN_CHARS - newEntry.length} more characters for analysis
                </span>
              ) : newEntry.length >= MIN_CHARS ? (
                <span className="text-green-400">✓ Enough content for analysis</span>
              ) : null}
            </div>
            <div className="text-sm text-gray-300 font-outfit">
              {newEntry.length}/{MAX_CHARS}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !selectedMood}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-outfit transition-colors duration-200 shadow-md"
            >
              {isLoading ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>
        {showSuccess && (
          <div className="absolute top-0 left-0 right-0 flex justify-center">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-down font-outfit">
              Entry saved successfully!
            </div>
          </div>
        )}
      </form>

      {showEntries && (
        <div className="space-y-4">
          <h3 className="text-xl font-outfit font-semibold text-white mb-4">Your Entries</h3>
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/20 transition-transform hover:scale-[1.01] duration-200">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <p className="text-gray-600 font-outfit">
                        {formatDate(entry.createdAt)}
                      </p>
                      {entry.selectedMood && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
                          <span className="text-xl">{getMoodEmoji(entry.selectedMood)}</span>
                          <span className="text-sm text-gray-600 font-outfit">{getMoodLabel(entry.selectedMood)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-900 font-dm-sans line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                  <button 
                    onClick={() => initiateDelete(entry.id)}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                    title="Delete entry"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  {entry.moodSummary && (
                    <div>
                      <p className="text-sm text-blue-800 font-outfit mb-2">Mood Analysis:</p>
                      <p className="text-sm text-gray-600 font-dm-sans">{entry.moodSummary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
              <p className="text-white font-outfit">You haven't created any journal entries yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-white/20">
            <h4 className="text-xl font-outfit font-semibold text-gray-800 mb-4">Confirm Deletion</h4>
            <p className="text-gray-600 mb-6 font-dm-sans">Are you sure you want to delete this journal entry? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-outfit"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-outfit flex items-center"
              >
                {isDeleting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 