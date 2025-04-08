
import React, { useRef, useEffect, useState } from 'react';
import YouTube from 'react-youtube';
import { Volume, Volume1, Volume2, VolumeX, Music, Play, Pause, RefreshCcw } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string | null;
  onReady: () => void;
  onPlaying: () => void;
  onPaused: () => void;
  onRestart?: () => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  onReady,
  onPlaying,
  onPaused,
  onRestart
}) => {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
    },
  };

  const handleReady = (event: any) => {
    playerRef.current = event.target;
    event.target.setVolume(volume);
    onReady();
  };

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
        onPaused();
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
        onPlaying();
      }
    }
  };

  const handleRestart = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      if (!isPlaying) {
        playerRef.current.playVideo();
        setIsPlaying(true);
        onPlaying();
      }
      if (onRestart) {
        onRestart();
      }
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  // Render volume icon based on level
  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={20} />;
    if (volume < 33) return <Volume size={20} />;
    if (volume < 66) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  if (!videoId) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-musitype-dark p-4 border-t border-gray-800">
      <div className="hidden">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={handleReady}
          onStateChange={(e) => {
            if (e.data === 1) {
              setIsPlaying(true);
              onPlaying();
            } else if (e.data === 2) {
              setIsPlaying(false);
              onPaused();
            }
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Music className="text-musitype-primary" size={24} />
          <span className="text-musitype-light text-sm truncate max-w-[200px]">
            {videoId ? "Now Playing" : "No video selected"}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlay}
            className="text-musitype-light hover:text-musitype-primary transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={handleRestart}
            className="text-musitype-light hover:text-musitype-primary transition-colors"
            aria-label="Restart"
          >
            <RefreshCcw size={20} />
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="text-musitype-light hover:text-musitype-primary transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              <VolumeIcon />
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-musitype-primary"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
