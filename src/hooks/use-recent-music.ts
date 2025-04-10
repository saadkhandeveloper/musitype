
import { useState, useEffect } from 'react';

export interface RecentMusic {
  videoId: string;
  title: string;
  timestamp: number;
}

const MAX_RECENT_ITEMS = 5;

export function useRecentMusic() {
  const [recentMusic, setRecentMusic] = useState<RecentMusic[]>([]);

  // Load recent music from localStorage on mount
  useEffect(() => {
    const storedMusic = localStorage.getItem('recentMusic');
    if (storedMusic) {
      try {
        setRecentMusic(JSON.parse(storedMusic));
      } catch (error) {
        console.error('Failed to parse recent music from localStorage:', error);
        // If parsing fails, clear the localStorage item
        localStorage.removeItem('recentMusic');
      }
    }
  }, []);

  // Save a new music item
  const saveMusic = (videoId: string, title: string) => {
    if (!videoId || !title) return;
    
    setRecentMusic(prev => {
      // Remove the item if it already exists
      const filtered = prev.filter(item => item.videoId !== videoId);
      
      // Add the new item at the beginning
      const newList = [
        { videoId, title, timestamp: Date.now() },
        ...filtered
      ].slice(0, MAX_RECENT_ITEMS); // Keep only the most recent items
      
      // Save to localStorage
      localStorage.setItem('recentMusic', JSON.stringify(newList));
      
      return newList;
    });
  };

  // Clear all recent music
  const clearRecentMusic = () => {
    localStorage.removeItem('recentMusic');
    setRecentMusic([]);
  };

  // Remove a specific music item
  const removeMusic = (videoId: string) => {
    setRecentMusic(prev => {
      const newList = prev.filter(item => item.videoId !== videoId);
      localStorage.setItem('recentMusic', JSON.stringify(newList));
      return newList;
    });
  };

  return {
    recentMusic,
    saveMusic,
    clearRecentMusic,
    removeMusic
  };
}
