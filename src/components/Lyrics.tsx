
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Eye } from 'lucide-react';

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

// Genius API credentials
const GENIUS_CLIENT_ID = 'VkZ-RRMll6Jnx_XULP8vUcv1HOwtq-pa26BYeDzcBvVVn6PvI1NXKVWM9Ohq4yjX';
const GENIUS_CLIENT_SECRET = 'nIo6vSMSMbQOInINJf-JTIT6hNKt_Jyp_vF9GXJI6GUpnplIrLacvdQzafOo5njQAQrPrMxVU6cqDnHJ5LoRzg';

const Lyrics: React.FC<LyricsProps> = ({ videoId, onLyricsSelect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lyrics, setLyrics] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

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
      let searchQuery = videoTitle
        .replace(/(official\s*(music)?\s*video|lyrics|official|ft\.?|feat\.?|featuring)/gi, '')
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .trim();
      
      // Artist - Song format works best for lyrics APIs
      let artist = '';
      let songTitle = searchQuery;
      
      // Check if title contains a hyphen (common format is "Artist - Song Title")
      if (searchQuery.includes('-')) {
        const parts = searchQuery.split('-').map(part => part.trim());
        artist = parts[0];
        songTitle = parts.slice(1).join(' '); // In case there are multiple hyphens
      }
      
      // Try with Genius API directly (first attempt)
      try {
        const options = {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': '3d85e2f108mshac4f73b15d8e6cap1beb54jsn5fa6d7aff68f',
            'X-RapidAPI-Host': 'genius-song-lyrics1.p.rapidapi.com'
          }
        };
        
        // Search for the song using Genius API
        const searchResponse = await fetch(`https://genius-song-lyrics1.p.rapidapi.com/search?q=${encodeURIComponent(searchQuery)}&per_page=3`, options);
        
        if (!searchResponse.ok) {
          throw new Error('Genius API search failed');
        }
        
        const searchData = await searchResponse.json();
        
        if (!searchData.hits || searchData.hits.length === 0) {
          throw new Error('No song matches found in Genius API');
        }
        
        // Find the best match by comparing titles
        let bestMatch = searchData.hits[0];
        const lowerSearchQuery = searchQuery.toLowerCase();
        
        for (const hit of searchData.hits) {
          const hitTitle = hit.result.title.toLowerCase();
          const hitArtist = hit.result.primary_artist.name.toLowerCase();
          
          if (
            hitTitle.includes(songTitle.toLowerCase()) || 
            lowerSearchQuery.includes(hitTitle) ||
            (artist && hitArtist.includes(artist.toLowerCase()))
          ) {
            bestMatch = hit;
            break;
          }
        }
        
        const songId = bestMatch.result.id;
        
        // Get the lyrics for the song
        const lyricsResponse = await fetch(`https://genius-song-lyrics1.p.rapidapi.com/song/lyrics/?id=${songId}`, options);
        
        if (!lyricsResponse.ok) {
          throw new Error('Failed to fetch lyrics from Genius API');
        }
        
        const lyricsData = await lyricsResponse.json();
        
        if (!lyricsData.lyrics || !lyricsData.lyrics.lyrics || !lyricsData.lyrics.lyrics.body) {
          throw new Error('No lyrics content found in Genius API');
        }
        
        const lyrics = lyricsData.lyrics.lyrics.body.plain;
        
        setLyrics(lyrics);
        onLyricsSelect(lyrics);
        toast.success('Lyrics loaded successfully!');
        setShowPreview(true);
        return;
      } catch (error) {
        console.error('Genius API fetch failed:', error);
        // Continue to next method
      }
      
      // Try to fetch lyrics from lyrics.ovh API (second attempt)
      try {
        const lyricsResponse = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist || 'unknown')}/${encodeURIComponent(songTitle)}`);
        
        if (!lyricsResponse.ok) {
          throw new Error('Could not find lyrics for this song');
        }
        
        const lyricsData = await lyricsResponse.json();
        
        if (!lyricsData.lyrics || lyricsData.lyrics.trim() === '') {
          throw new Error('No lyrics found for this song');
        }
        
        // Clean up the lyrics
        const cleanedLyrics = lyricsData.lyrics
          .replace(/\r\n/g, '\n')  // Normalize line endings
          .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
          .trim();
        
        setLyrics(cleanedLyrics);
        onLyricsSelect(cleanedLyrics);
        toast.success('Lyrics loaded successfully!');
        setShowPreview(true);
        return;
      } catch (error) {
        console.error('Lyrics.ovh API failed:', error);
        // Continue to third method
      }
      
      // Try a third approach with Happi Lyrics API
      try {
        const options = {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': '3d85e2f108mshac4f73b15d8e6cap1beb54jsn5fa6d7aff68f',
            'X-RapidAPI-Host': 'happi-lyrics-api.p.rapidapi.com'
          }
        };
        
        const response = await fetch(`https://happi-lyrics-api.p.rapidapi.com/search?q=${encodeURIComponent(searchQuery)}&limit=1`, options);
        
        if (!response.ok) {
          throw new Error('Failed to find lyrics with backup API');
        }
        
        const data = await response.json();
        
        if (!data.success || !data.result || data.result.length === 0) {
          throw new Error('No lyrics found with backup API');
        }
        
        const songInfo = data.result[0];
        const lyricsResponse = await fetch(`https://happi-lyrics-api.p.rapidapi.com/lyrics/${songInfo.track_id}`, options);
        
        if (!lyricsResponse.ok) {
          throw new Error('Failed to fetch complete lyrics');
        }
        
        const lyricsData = await lyricsResponse.json();
        
        if (!lyricsData.success || !lyricsData.result || !lyricsData.result.lyrics) {
          throw new Error('No lyrics content found');
        }
        
        setLyrics(lyricsData.result.lyrics);
        onLyricsSelect(lyricsData.result.lyrics);
        toast.success('Lyrics loaded successfully!');
        setShowPreview(true);
        return;
      } catch (error) {
        console.error('Third lyrics fetch approach failed:', error);
        // Fall back to sample lyrics if all API attempts failed
      }
      
      // Fall back to sample lyrics if all API attempts failed
      const loadedLyrics = SAMPLE_LYRICS.join('\n');
      setLyrics(loadedLyrics);
      onLyricsSelect(loadedLyrics);
      toast.warning('Using sample lyrics (could not fetch actual lyrics)');
      setShowPreview(true);
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
    setShowPreview(true);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
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

      {lyrics && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-musitype-light font-semibold">Preview</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={togglePreview}
              className="text-musitype-gray hover:text-musitype-light"
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          {showPreview && (
            <div className="bg-musitype-dark border border-gray-700 rounded p-3 max-h-48 overflow-y-auto text-sm text-musitype-light whitespace-pre-wrap">
              {lyrics}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Lyrics;
