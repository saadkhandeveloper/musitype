
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TypingAreaProps {
  text: string;
  isPlaying: boolean;
  videoTitle?: string;
  onRestart?: () => void;
}

type CharState = 'waiting' | 'correct' | 'incorrect' | 'active';

interface CharData {
  char: string;
  state: CharState;
}

const TypingArea: React.FC<TypingAreaProps> = ({ text, isPlaying, videoTitle, onRestart }) => {
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
      resetTyping();
    }
  }, [text]);

  const resetTyping = () => {
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
    
    // Force focus on the input when resetting
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Focus input when playing starts or component mounts
  useEffect(() => {
    if (isPlaying && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPlaying]);

  // Reset typing when onRestart is called
  useEffect(() => {
    if (onRestart) {
      resetTyping();
    }
  }, [onRestart]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    e.preventDefault(); // Prevent default for all key presses
    
    // Ignore if we're at the end of the text or not playing
    if (cursorPos >= charData.length || !isPlaying) return;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Always prevent default for space to avoid page scrolling
    if (e.key === ' ') {
      e.preventDefault();
    }

    // Ignore if we're at the end of the text or not playing
    if (cursorPos >= charData.length || !isPlaying) return;
    
    // Ignore modifier keys and other non-character keys
    if (
      e.key === 'Shift' || 
      e.key === 'Control' || 
      e.key === 'Alt' || 
      e.key === 'Meta' ||
      e.key === 'CapsLock' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown' ||
      e.key === 'Insert' ||
      e.key === 'Delete' ||
      e.key.startsWith('F') ||
      e.key === 'NumLock' ||
      e.key === 'ScrollLock' ||
      e.key === 'Pause'
    ) {
      return;
    }

    // Still ignore key combos
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Handle backspace key
    if (e.key === 'Backspace') {
      e.preventDefault();
      // Can't go back before the first character
      if (cursorPos > 0) {
        // Reset the current character to waiting
        const newCharData = [...charData];
        newCharData[cursorPos].state = 'waiting';
        
        // Check if the previous character was correct or incorrect
        if (newCharData[cursorPos - 1].state === 'correct') {
          setStats(prev => ({
            ...prev,
            correctChars: Math.max(prev.correctChars - 1, 0),
            totalChars: Math.max(prev.totalChars - 1, 0),
          }));
        } else if (newCharData[cursorPos - 1].state === 'incorrect') {
          setStats(prev => ({
            ...prev,
            incorrectChars: Math.max(prev.incorrectChars - 1, 0),
            totalChars: Math.max(prev.totalChars - 1, 0),
          }));
        }
        
        // Move the cursor back and set the previous character as active
        newCharData[cursorPos - 1].state = 'active';
        setCursorPos(cursorPos - 1);
        setCharData(newCharData);
        updateStats();
      }
      return;
    }

    // Process regular key presses for typing
    handleKeyPress(e);
  };

  const updateStats = () => {
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      const totalChars = stats.correctChars + stats.incorrectChars;
      
      // Improved WPM calculation using "standard" 5 characters per word metric
      const wpm = Math.round((stats.correctChars / 5) / Math.max(timeElapsed, 0.01));
      
      // Accuracy calculation
      const accuracy = totalChars > 0 ? Math.round((stats.correctChars / totalChars) * 100) : 100;

      setStats(prev => ({
        ...prev,
        wpm,
        accuracy,
      }));
    }
  };

  // Auto-scroll the typing area to keep the current character in view
  useEffect(() => {
    if (containerRef.current && charData.length > 0) {
      const container = containerRef.current;
      const activeElements = container.getElementsByClassName('text-musitype-gray bg-musitype-dark/30 text-opacity-90');
      
      if (activeElements.length > 0) {
        const activeElement = activeElements[0];
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        
        // Check if the active element is out of view
        if (
          activeRect.top < containerRect.top + 40 || 
          activeRect.bottom > containerRect.bottom - 40
        ) {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [cursorPos]);

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
        className="w-full min-h-[200px] flex items-center justify-center text-center font-mono text-2xl leading-relaxed py-10 overflow-auto"
      >
        <div className="max-w-4xl">
          {charData.map((char, index) => (
            <span 
              key={index}
              className={cn(
                char.state === 'waiting' && "text-musitype-gray text-opacity-30",
                char.state === 'correct' && "text-musitype-primary",
                char.state === 'incorrect' && "text-musitype-error",
                char.state === 'active' && "text-musitype-gray bg-musitype-dark/30 text-opacity-90"
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
