
import React, { useState } from 'react';
import LinkInput from '@/components/LinkInput';
import YouTubePlayer from '@/components/YouTubePlayer';
import TypingArea from '@/components/TypingArea';
import Lyrics from '@/components/Lyrics';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  const handleVideoIdSubmit = (id: string) => {
    setVideoId(id);
    setIsPlaying(false);
    setTypingText('');
    
    // Fetch video title
    fetchVideoTitle(id);
  };

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

  const handleLyricsSelect = (lyrics: string) => {
    setTypingText(lyrics);
  };

  return (
    <div className="min-h-screen bg-musitype-darker text-musitype-light flex flex-col">
      <header className="py-6 text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-musitype-primary">Musi</span>
          <span>type</span>
        </h1>
        <p className="text-musitype-gray">Type to the rhythm of your favorite music</p>
      </header>

      <main className="container px-4 mx-auto pb-32 flex-1 flex flex-col">
        <div className="space-y-8 mb-8">
          <section>
            <LinkInput onVideoIdSubmit={handleVideoIdSubmit} />
          </section>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {videoId && isPlayerReady && typingText && (
            <TypingArea 
              text={typingText} 
              isPlaying={isPlaying} 
              videoTitle={videoTitle}
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
      />
      
      <Toaster position="top-center" />
    </div>
  );
};

export default Index;
