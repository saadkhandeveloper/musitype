
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LyricsProps {
  videoId: string | null;
  onLyricsSelect: (lyrics: string) => void;
}

// Example lyrics for fallback purposes
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
  const [videoTitle, setVideoTitle] = useState<string>('');

  useEffect(() => {
    if (videoId) {
      // Reset lyrics when video changes
      setLyrics('');
      fetchVideoTitle(videoId);
    }
  }, [videoId]);

  const fetchVideoTitle = async (id: string) => {
    try {
      // Use the YouTube oEmbed API to get video info
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
      if (!response.ok) throw new Error('Failed to fetch video info');
      
      const data = await response.json();
      setVideoTitle(data.title);
    } catch (error) {
      console.error('Error fetching video title:', error);
      setVideoTitle('');
    }
  };

  const handleFetchLyrics = async () => {
    if (!videoId || !videoTitle) {
      toast.error('Unable to fetch lyrics: No video loaded or title unavailable');
      return;
    }

    setIsLoading(true);
    
    try {
      // Clean up the title to use as search query
      // Remove things like "Official Video", "ft.", "feat." etc.
      let searchQuery = videoTitle
        .replace(/(official\s*(music)?\s*video|lyrics|official|ft\.?|feat\.?|featuring)/gi, '')
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .trim();
      
      // Use Genius API through a cors-anywhere proxy
      const response = await fetch(`https://cors-anywhere.herokuapp.com/https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': 'Bearer GENIUS_API_TOKEN' // Note: In a real app, this would be an environment variable
        }
      }).catch(() => {
        // If cors-anywhere fails, we'll use our fallback
        throw new Error('CORS proxy error');
      });
      
      if (!response.ok) throw new Error('Failed to fetch from Genius API');
      
      const data = await response.json();
      
      if (data.response.hits.length === 0) {
        throw new Error('No lyrics found for this song');
      }
      
      // Get the first hit's lyrics URL
      const lyricsPath = data.response.hits[0].result.path;
      const lyricsUrl = `https://cors-anywhere.herokuapp.com/https://genius.com${lyricsPath}`;
      
      // Fetch the HTML page containing lyrics
      const lyricsResponse = await fetch(lyricsUrl).catch(() => {
        throw new Error('CORS proxy error');
      });
      
      if (!lyricsResponse.ok) throw new Error('Failed to fetch lyrics page');
      
      const html = await lyricsResponse.text();
      
      // Simple parsing to extract lyrics
      // Note: This is a simplistic approach and might not work for all pages
      // In a production app, you'd use a more robust method or a backend service
      const lyricsDiv = html.split('<div class="lyrics">')[1]?.split('</div>')[0];
      
      if (!lyricsDiv) {
        throw new Error('Could not parse lyrics from page');
      }
      
      // Clean up HTML tags
      const cleanLyrics = lyricsDiv
        .replace(/<[^>]*>/g, '')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      setLyrics(cleanLyrics);
      onLyricsSelect(cleanLyrics);
      toast.success('Lyrics loaded successfully!');
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      
      // Fall back to sample lyrics if we couldn't fetch real ones
      const loadedLyrics = SAMPLE_LYRICS.join(' ');
      setLyrics(loadedLyrics);
      onLyricsSelect(loadedLyrics);
      toast.warning('Using sample lyrics (could not fetch actual lyrics)');
    } finally {
      setIsLoading(false);
    }
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
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Lyrics...
            </>
          ) : (
            videoTitle ? `Get Lyrics for "${videoTitle}"` : 'Use Example Lyrics'
          )}
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
