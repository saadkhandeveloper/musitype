
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TypingAreaProps {
  text: string;
  isPlaying: boolean;
  videoTitle?: string;
}

type CharState = 'waiting' | 'correct' | 'incorrect' | 'active';

interface CharData {
  char: string;
  state: CharState;
}

const TypingArea: React.FC<TypingAreaProps> = ({ text, isPlaying, videoTitle }) => {
  const [charData, setCharData] = useState<CharData[]>([]);
  const [cursorPos, setCursorPos] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize character data
  useEffect(() => {
    if (text) {
      const initialCharData = text.split('').map((char) => ({
        char,
        state: 'waiting' as CharState,
      }));
      
      if (initialCharData.length > 0) {
        initialCharData[0].state = 'active';
      }
      
      setCharData(initialCharData);
      setCursorPos(0);
      setStartTime(null);
      setStats({
        wpm: 0,
        accuracy: 100,
        correctChars: 0,
        incorrectChars: 0,
        totalChars: 0,
      });
    }
  }, [text]);

  // Focus input when playing starts
  useEffect(() => {
    if (isPlaying && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPlaying]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ignore special key presses that aren't characters
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Prevent default for space to avoid page scrolling
    if (e.key === ' ') {
      e.preventDefault();
    }

    // Ignore if we're at the end of the text
    if (cursorPos >= charData.length) return;

    // Start timing on first keystroke
    if (startTime === null) {
      setStartTime(Date.now());
    }

    const currentChar = charData[cursorPos].char;
    const newCharData = [...charData];
    
    // Special handling for space
    const pressedKey = e.key === ' ' ? ' ' : e.key;

    // Check if the pressed key matches the current character
    if (pressedKey === currentChar) {
      newCharData[cursorPos].state = 'correct';
      setStats(prev => ({
        ...prev,
        correctChars: prev.correctChars + 1,
        totalChars: prev.totalChars + 1,
      }));
    } else {
      // Handle backspace
      if (e.key === 'Backspace') {
        // Can't go back before the first character
        if (cursorPos > 0) {
          newCharData[cursorPos].state = 'waiting';
          newCharData[cursorPos - 1].state = 'active';
          setCursorPos(cursorPos - 1);
        }
        return;
      }
      
      // Wrong character
      newCharData[cursorPos].state = 'incorrect';
      setStats(prev => ({
        ...prev,
        incorrectChars: prev.incorrectChars + 1,
        totalChars: prev.totalChars + 1,
      }));
    }

    // Move to next character if there is one
    if (cursorPos < charData.length - 1) {
      newCharData[cursorPos + 1].state = 'active';
      setCursorPos(cursorPos + 1);
    }

    setCharData(newCharData);
    
    // Update WPM and accuracy
    updateStats();
  };

  const updateStats = () => {
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      const totalChars = stats.correctChars + stats.incorrectChars;
      const wpm = Math.round((stats.correctChars / 5) / Math.max(timeElapsed, 0.01));
      const accuracy = totalChars > 0 ? Math.round((stats.correctChars / totalChars) * 100) : 100;

      setStats(prev => ({
        ...prev,
        wpm,
        accuracy,
      }));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
      <div className="mb-4 flex justify-center space-x-8">
        <div className="text-center">
          <p className="text-musitype-gray text-sm">WPM</p>
          <p className="text-musitype-primary text-3xl font-mono">{stats.wpm}</p>
        </div>
        <div className="text-center">
          <p className="text-musitype-gray text-sm">ACCURACY</p>
          <p className="text-musitype-primary text-3xl font-mono">{stats.accuracy}%</p>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="w-full min-h-[200px] flex items-center justify-center text-center font-mono text-2xl leading-relaxed py-10"
      >
        <div className="max-w-4xl">
          {charData.map((char, index) => (
            <span 
              key={index}
              className={cn(
                char.state === 'waiting' && "text-opacity-30 text-musitype-gray",
                char.state === 'correct' && "text-musitype-primary",
                char.state === 'incorrect' && "text-musitype-error",
                char.state === 'active' && "text-musitype-gray bg-musitype-dark/30 text-opacity-60"
              )}
            >
              {char.char}
            </span>
          ))}
        </div>
      </div>
      
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute -z-10"
        onKeyDown={handleKeyDown}
        disabled={!isPlaying}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
      
      {!isPlaying && charData.length > 0 && (
        <p className="text-center text-musitype-gray">
          Play the music to start typing
        </p>
      )}

      {videoTitle && (
        <div className="mt-8 text-center text-musitype-gray text-sm">
          <p>Now playing: {videoTitle}</p>
        </div>
      )}
    </div>
  );
};

export default TypingArea;
