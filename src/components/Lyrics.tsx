
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecentMusic } from '@/hooks/use-recent-music';

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
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [lyricsFound, setLyricsFound] = useState<boolean | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  const { saveMusic } = useRecentMusic();

  useEffect(() => {
    if (videoId) {
      fetchVideoTitle(videoId);
    }
  }, [videoId]);

  // When videoId changes, automatically fetch lyrics if we have a title
  useEffect(() => {
    if (videoId && videoTitle) {
      fetchLyrics();
    }
  }, [videoId, videoTitle]);

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

  const fetchLyrics = async () => {
    if (!videoId || !videoTitle) {
      toast.error('Unable to fetch lyrics: No video loaded or title unavailable');
      return;
    }

    setIsLoading(true);
    setLyricsFound(null);
    
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
        
        // Save to recent music BEFORE calling onLyricsSelect
        if (videoId) {
          saveMusic(videoId, videoTitle);
        }
        
        onLyricsSelect(lyrics);
        setLyricsFound(true);
        toast.success('Lyrics loaded successfully!');
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
        
        // Save to recent music BEFORE calling onLyricsSelect
        if (videoId) {
          saveMusic(videoId, videoTitle);
        }
        
        onLyricsSelect(cleanedLyrics);
        setLyricsFound(true);
        toast.success('Lyrics loaded successfully!');
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
        
        // Save to recent music BEFORE calling onLyricsSelect
        if (videoId) {
          saveMusic(videoId, videoTitle);
        }
        
        onLyricsSelect(lyricsData.result.lyrics);
        setLyricsFound(true);
        toast.success('Lyrics loaded successfully!');
        return;
      } catch (error) {
        console.error('Third lyrics fetch approach failed:', error);
        // All API attempts failed
        setLyricsFound(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissError = () => {
    setShowErrorModal(false);
    // Use sample lyrics as fallback
    const loadedLyrics = SAMPLE_LYRICS.join('\n');
    onLyricsSelect(loadedLyrics);
    toast.warning('Using sample lyrics instead');
  };

  // Show error modal when lyrics are not found
  useEffect(() => {
    if (lyricsFound === false) {
      setShowErrorModal(true);
    } else {
      setShowErrorModal(false);
    }
  }, [lyricsFound]);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center z-50">
      {isLoading && (
        <div className="flex items-center justify-center pointer-events-auto bg-black/50 p-4 rounded-lg shadow-lg animate-fade-in">
          <Loader2 className="animate-spin mr-2 text-musitype-primary" />
          <span className="text-musitype-light">Fetching lyrics...</span>
        </div>
      )}
      
      {!isLoading && showErrorModal && (
        <div className="pointer-events-auto bg-musitype-darker/95 p-6 rounded-xl border border-musitype-gray/30 shadow-2xl max-w-md w-full mx-4 backdrop-blur animate-scale-in">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0 top-0 text-musitype-gray hover:text-musitype-light"
              onClick={handleDismissError}
            >
              <X size={18} />
            </Button>
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-musitype-primary/10 p-3 rounded-full mb-4">
                <AlertCircle className="text-musitype-primary" size={28} />
              </div>
              <h3 className="text-musitype-light text-xl font-bold mb-2">No Lyrics Found</h3>
              <p className="text-musitype-gray text-center">
                We couldn't find lyrics for this song.
              </p>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-musitype-gray text-sm font-medium mb-2">Try these options:</p>
              <ul className="text-musitype-gray/80 text-sm list-disc pl-5 space-y-2">
                <li>Search for a different song</li>
                <li>Try a song with "lyrics" in the title</li>
                <li>Check if the video uses "Artist - Song" format</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-center">
              <Button 
                variant="outline" 
                className="border-musitype-primary/50 hover:bg-musitype-primary/10 text-musitype-primary" 
                onClick={handleDismissError}
              >
                Use Sample Lyrics Instead
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lyrics;
