
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LyricsProps {
  videoId: string | null;
  onLyricsSelect: (lyrics: string) => void;
}

// Example lyrics for demonstration purposes
const SAMPLE_LYRICS = [
  "Today is gonna be the day that they're gonna throw it back to you",
  "By now you should've somehow realized what you gotta do",
  "I don't believe that anybody feels the way I do about you now",
  "And all the roads we have to walk are winding",
  "And all the lights that lead us there are blinding",
  "There are many things that I would like to say to you but I don't know how"
];

const Lyrics: React.FC<LyricsProps> = ({ videoId, onLyricsSelect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lyrics, setLyrics] = useState<string>('');

  useEffect(() => {
    if (videoId) {
      // Reset lyrics when video changes
      setLyrics('');
    }
  }, [videoId]);

  const handleFetchLyrics = () => {
    if (!videoId) {
      toast.error('Please load a YouTube video first');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call to fetch lyrics
    setTimeout(() => {
      // In a real app, this would be an API call to fetch actual lyrics
      // For this demo, we'll use the sample lyrics
      const loadedLyrics = SAMPLE_LYRICS.join(' ');
      setLyrics(loadedLyrics);
      onLyricsSelect(loadedLyrics);
      setIsLoading(false);
      toast.success('Lyrics loaded successfully!');
    }, 1500);
  };

  const handleCustomLyrics = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLyrics(e.target.value);
  };

  const handleSubmitCustomLyrics = () => {
    if (lyrics.trim().length < 10) {
      toast.error('Please enter more text for typing practice');
      return;
    }
    onLyricsSelect(lyrics);
    toast.success('Custom lyrics set for typing!');
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4">
        <Button
          onClick={handleFetchLyrics}
          disabled={isLoading || !videoId}
          className="w-full bg-musitype-dark text-musitype-light border border-gray-700 hover:bg-musitype-dark/80"
        >
          {isLoading ? 'Loading...' : 'Use Example Lyrics'}
        </Button>
      </div>
      
      <div className="border-t border-gray-800 pt-4">
        <p className="text-musitype-gray mb-2 text-sm">Or enter custom text for typing:</p>
        <textarea
          value={lyrics}
          onChange={handleCustomLyrics}
          placeholder="Enter custom text for typing practice..."
          className="w-full h-24 p-2 bg-musitype-dark border border-gray-700 text-musitype-light rounded mb-2 focus:border-musitype-primary outline-none"
        />
        <Button
          onClick={handleSubmitCustomLyrics}
          disabled={lyrics.trim().length < 10}
          className="w-full bg-musitype-primary text-musitype-darker hover:bg-musitype-primary/90"
        >
          Use Custom Text
        </Button>
      </div>
    </div>
  );
};

export default Lyrics;
