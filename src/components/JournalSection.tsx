import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
  moodSummary?: string;
}

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
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    if (newEntry.length < MIN_CHARS) {
      // Could add a proper toast notification here
      alert(`Please write at least ${MIN_CHARS} characters for meaningful mood analysis.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newEntry }),
      });

      if (!response.ok) throw new Error("Failed to create entry");
      
      const entry = await response.json();
      setEntries([entry, ...entries]);
      setNewEntry("");
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

  if (!session) {
    return <div>Please sign in to access your journal.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-outfit font-bold text-white">Mood Journal</h2>
        <button
          onClick={() => setShowEntries(!showEntries)}
          className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 font-outfit transition-colors duration-200 text-sm"
        >
          {showEntries ? "Hide Past Entries" : "View Past Entries"}
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-8 relative">
        <textarea
          value={newEntry}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setNewEntry(e.target.value);
            }
          }}
          placeholder="How are you feeling today? Write your thoughts..."
          className="w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white text-gray-900 font-dm-sans text-lg leading-relaxed"
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
        <button
          type="submit"
          disabled={isLoading || newEntry.length < MIN_CHARS}
          className="mt-3 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-outfit transition-colors duration-200"
        >
          {isLoading ? "Saving..." : "Save Entry"}
        </button>
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
            <div key={entry.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-600 font-outfit mb-2">
                    {formatDate(entry.createdAt)}
                  </p>
                  <p className="text-gray-900 font-dm-sans line-clamp-2">
                    {entry.content}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-outfit"
                  >
                    {selectedEntry === entry.id ? "Hide" : "View"}
                  </button>
                  <button
                    onClick={() => initiateDelete(entry.id)}
                    disabled={isDeleting}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-outfit"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {selectedEntry === entry.id && (
                <div className="px-4 pb-4">
                  <div className="pt-4 border-t">
                    <p className="whitespace-pre-wrap text-gray-800 font-dm-sans text-lg leading-relaxed">
                      {entry.content}
                    </p>
                    {entry.moodSummary && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-800 font-outfit mb-2">Mood Analysis:</p>
                        <p className="text-gray-700 font-dm-sans">{entry.moodSummary}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-[#1a1625] bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#2a2438] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-700">
            <h4 className="text-xl font-outfit font-semibold text-white mb-3">
              Delete Entry
            </h4>
            <p className="text-gray-300 font-dm-sans mb-6">
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm font-outfit text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-outfit bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 