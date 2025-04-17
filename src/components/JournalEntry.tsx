'use client';

import { useState } from 'react';

interface JournalEntryProps {
  entry: {
    id: string;
    content: string;
    createdAt: string;
  };
  onDelete: (id: string) => void;
}

export default function JournalEntry({ entry, onDelete }: JournalEntryProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/journal/${entry.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      onDelete(entry.id);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-600 text-sm">
            {new Date(entry.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-2 whitespace-pre-wrap">{entry.content}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
} 