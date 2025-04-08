import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TypingAreaProps {
  text: string;
  isPlaying: boolean;
}

type CharState = 'waiting' | 'correct' | 'incorrect' | 'active';

interface CharData {
  char: string;
  state: CharState;
}

const TypingArea: React.FC<TypingAreaProps> = ({ text, isPlaying }) => {
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

  // Scroll the typing area to keep the active character in view
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const activeChar = container.querySelector('.char-active');
      
      if (activeChar) {
        const containerRect = container.getBoundingClientRect();
        const charRect = activeChar.getBoundingClientRect();
        
        // If the active character is outside the visible area, scroll to it
        if (
          charRect.left < containerRect.left ||
          charRect.right > containerRect.right
        ) {
          // Calculate scroll to center the active character
          const scrollAmount = charRect.left - containerRect.left - containerRect.width / 2 + charRect.width / 2;
          container.scrollLeft += scrollAmount;
        }
      }
    }
  }, [cursorPos]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 flex justify-center space-x-8">
        <div className="text-center">
          <p className="text-musitype-gray text-sm">WPM</p>
          <p className="text-musitype-primary text-3xl font-mono">{stats.wpm}</p>
        </div>
        <div className="text-center">
          <p className="text-musitype-gray text-sm">Accuracy</p>
          <p className="text-musitype-primary text-3xl font-mono">{stats.accuracy}%</p>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="text-2xl leading-relaxed font-mono h-24 overflow-x-auto whitespace-pre overflow-y-hidden bg-musitype-dark p-4 rounded mb-6"
      >
        {charData.map((char, index) => (
          <span 
            key={index}
            className={cn(
              `char-${char.state}`,
              char.state === 'active' && "bg-musitype-dark/30"
            )}
          >
            {char.char}
          </span>
        ))}
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
      
      {!isPlaying && (
        <p className="text-center text-musitype-gray">
          {charData.length > 0 
            ? "Play the music to start typing" 
            : "Load a music video to get started"}
        </p>
      )}
    </div>
  );
};

export default TypingArea;
