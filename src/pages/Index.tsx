import React, { useState, useCallback } from 'react';
import LinkInput from '@/components/LinkInput';
import YouTubePlayer from '@/components/YouTubePlayer';
import TypingArea from '@/components/TypingArea';
import Lyrics from '@/components/Lyrics';
import { useRecentMusic } from '@/hooks/use-recent-music';
import { Toaster } from '@/components/ui/sonner';
import { Music, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const Index = () => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [key, setKey] = useState(0); // Used to force TypingArea to reset
  
  const { recentMusic, saveMusic, removeMusic } = useRecentMusic();

  const handleVideoIdSubmit = (id: string) => {
    setVideoId(id);
    setIsPlaying(false);
    setTypingText('');
    
    // Fetch video title but don't save to recent music yet
    fetchVideoTitle(id);
  };

  const fetchVideoTitle = async (id: string) => {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
      if (!response.ok) throw new Error('Failed to fetch video info');
      
      const data = await response.json();
      setVideoTitle(data.title);
    } catch (error) {
      console.error('Error fetching video title:', error);
      setVideoTitle('');
    }
  };

  const handleLyricsSelect = (lyrics: string) => {
    setTypingText(lyrics);
    // Reset the typing area when new lyrics are selected
    setKey(prevKey => prevKey + 1);
  };

  const handleRestart = useCallback(() => {
    // Force TypingArea component to reset by changing its key
    setKey(prevKey => prevKey + 1);
  }, []);

  const handleMusicSelect = (id: string) => {
    handleVideoIdSubmit(id);
  };

  return (
    <div className="min-h-screen bg-musitype-darker text-musitype-light flex flex-col items-center">
      <div className="w-full max-w-4xl px-4">
        <header className="py-6 text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-musitype-primary">Musi</span>
            <span>type</span>
          </h1>
          <p className="text-musitype-gray">Type to the rhythm of your favorite music</p>
        </header>

        <main className="space-y-6 w-full">
          <section>
            <LinkInput onVideoIdSubmit={handleVideoIdSubmit} />
          </section>

          {/* Recent Music Row */}
          {recentMusic.length > 0 && (
            <section className="w-full">
              <ScrollArea className="w-full border border-musitype-gray/20 rounded-lg p-4">
                <div className="flex space-x-4">
                  {recentMusic.map((item) => (
                    <div key={item.videoId} className="flex-none">
                      <Button
                        variant="outline"
                        className="flex items-center space-x-2 group hover:border-musitype-primary"
                        onClick={() => handleMusicSelect(item.videoId)}
                      >
                        <Music className="text-musitype-primary" size={16} />
                        <span className="max-w-[150px] truncate">{item.title}</span>
                        <X
                          size={14}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMusic(item.videoId);
                          }}
                        />
                      </Button>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>
          )}

          <div className="flex flex-col items-center justify-center min-h-[300px]">
            {videoId && isPlayerReady && typingText && (
              <TypingArea 
                key={key}
                text={typingText} 
                isPlaying={isPlaying} 
                videoTitle={videoTitle}
                onRestart={handleRestart}
              />
            )}
            
            {!isPlayerReady && videoId && (
              <div className="text-center py-8">
                <div className="animate-pulse text-musitype-gray">Loading player...</div>
              </div>
            )}
            
            {!videoId && (
              <div className="text-center py-12">
                <div className="mb-6 text-musitype-gray">
                  <p className="text-xl mb-2">How it works:</p>
                  <ol className="list-decimal list-inside text-left max-w-md mx-auto space-y-2">
                    <li>Paste a YouTube music video link above</li>
                    <li>Wait for the lyrics to load automatically</li>
                    <li>Play the music and type along to practice</li>
                    <li>See your WPM and accuracy stats in real-time</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </main>

        {videoId && (
          <Lyrics videoId={videoId} onLyricsSelect={handleLyricsSelect} />
        )}

        <YouTubePlayer 
          videoId={videoId} 
          onReady={() => setIsPlayerReady(true)}
          onPlaying={() => setIsPlaying(true)}
          onPaused={() => setIsPlaying(false)}
          onRestart={handleRestart}
        />
      </div>
      <Toaster position="top-center" />
    </div>
  );
};

export default Index;
