
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

  const handleVideoIdSubmit = (id: string) => {
    setVideoId(id);
    setIsPlaying(false);
    setTypingText('');
  };

  const handleLyricsSelect = (lyrics: string) => {
    setTypingText(lyrics);
  };

  return (
    <div className="min-h-screen bg-musitype-darker text-musitype-light">
      <header className="py-6 text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-musitype-primary">Musi</span>
          <span>type</span>
        </h1>
        <p className="text-musitype-gray">Type to the rhythm of your favorite music</p>
      </header>

      <main className="container px-4 mx-auto pb-32">
        <div className="space-y-12">
          <section>
            <LinkInput onVideoIdSubmit={handleVideoIdSubmit} />
          </section>

          {videoId && isPlayerReady && (
            <section className="space-y-8">
              <Lyrics videoId={videoId} onLyricsSelect={handleLyricsSelect} />
              
              {typingText && (
                <TypingArea text={typingText} isPlaying={isPlaying} />
              )}
            </section>
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
                  <li>Choose example lyrics or enter custom text</li>
                  <li>Play the music and type along to practice</li>
                  <li>See your WPM and accuracy stats in real-time</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </main>

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
