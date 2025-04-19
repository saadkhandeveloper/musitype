
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Toggle } from '@/components/ui/toggle';
import { Play, Pause } from 'lucide-react';

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
  const lastSentenceEnd = useRef<number>(-1);
  const [autoTyping, setAutoTyping] = useState(false);
  const autoTypingInterval = useRef<NodeJS.Timeout | null>(null);
  const typingSpeed = 150; // Characters per minute (roughly 150 WPM)

  const isEndOfSentence = (index: number): boolean => {
    if (index >= charData.length - 1) return true;
    
    const currentChar = charData[index].char;
    const nextChar = charData[index + 1]?.char;
    
    return (
      (currentChar === '.' || currentChar === '!' || currentChar === '?') && 
      (nextChar === ' ' || nextChar === '\n')
    );
  };

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
    lastSentenceEnd.current = -1;
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (text) {
      resetTyping();
    }
  }, [text]);

  useEffect(() => {
    if (isPlaying && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (onRestart) {
      resetTyping();
    }
  }, [onRestart]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    e.preventDefault();
    
    if (cursorPos >= charData.length || !isPlaying) return;

    if (startTime === null) {
      setStartTime(Date.now());
    }

    const currentChar = charData[cursorPos].char;
    const newCharData = [...charData];
    
    let pressedKey = e.key;
    
    if (pressedKey === "'" || pressedKey === "'" || pressedKey === "'" || pressedKey === "`") {
      pressedKey = "'";
    }
    
    if (pressedKey === ' ') {
      pressedKey = ' ';
    }
    
    let normalizedCurrentChar = currentChar;
    if (normalizedCurrentChar === "'" || normalizedCurrentChar === "'" || normalizedCurrentChar === "'" || normalizedCurrentChar === "`") {
      normalizedCurrentChar = "'";
    }
    
    if (pressedKey === normalizedCurrentChar) {
      newCharData[cursorPos].state = 'correct';
      setStats(prev => ({
        ...prev,
        correctChars: prev.correctChars + 1,
        totalChars: prev.totalChars + 1,
      }));
    } else {
      newCharData[cursorPos].state = 'incorrect';
      setStats(prev => ({
        ...prev,
        incorrectChars: prev.incorrectChars + 1,
        totalChars: prev.totalChars + 1,
      }));
    }

    if (isEndOfSentence(cursorPos) && cursorPos > lastSentenceEnd.current) {
      lastSentenceEnd.current = cursorPos;
      setTimeout(() => {
        scrollToCurrentPosition();
      }, 100);
    }

    if (cursorPos < charData.length - 1) {
      newCharData[cursorPos + 1].state = 'active';
      setCursorPos(cursorPos + 1);
    }

    setCharData(newCharData);
    updateStats();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
    }

    if (cursorPos >= charData.length || !isPlaying) return;
    
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

    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (cursorPos > 0) {
        const newCharData = [...charData];
        newCharData[cursorPos].state = 'waiting';
        
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
        
        newCharData[cursorPos - 1].state = 'active';
        setCursorPos(cursorPos - 1);
        setCharData(newCharData);
        updateStats();
      }
      return;
    }

    handleKeyPress(e);
  };

  const updateStats = () => {
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60;
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

  const scrollToCurrentPosition = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      const activeElements = container.getElementsByClassName('text-musitype-gray bg-musitype-dark/30 text-opacity-90');
      
      if (activeElements.length > 0) {
        const activeElement = activeElements[0];
        
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else if (cursorPos >= charData.length - 1) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    if (containerRef.current && charData.length > 0) {
      const container = containerRef.current;
      const activeElements = container.getElementsByClassName('text-musitype-gray bg-musitype-dark/30 text-opacity-90');
      
      if (activeElements.length > 0) {
        const activeElement = activeElements[0];
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        
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

  useEffect(() => {
    if (autoTyping && isPlaying) {
      const typeNextChar = () => {
        if (cursorPos >= charData.length) {
          setAutoTyping(false);
          return;
        }

        const currentChar = charData[cursorPos].char;
        const newCharData = [...charData];
        newCharData[cursorPos].state = 'correct';
        
        if (cursorPos < charData.length - 1) {
          newCharData[cursorPos + 1].state = 'active';
        }
        
        setCursorPos(prev => prev + 1);
        setCharData(newCharData);
        
        if (startTime === null) {
          setStartTime(Date.now());
        }
        
        setStats(prev => ({
          ...prev,
          correctChars: prev.correctChars + 1,
          totalChars: prev.totalChars + 1,
        }));

        updateStats();
      };

      const delay = 60000 / typingSpeed / 5;
      autoTypingInterval.current = setInterval(typeNextChar, delay);

      return () => {
        if (autoTypingInterval.current) {
          clearInterval(autoTypingInterval.current);
        }
      };
    }
  }, [autoTyping, isPlaying, cursorPos]);

  useEffect(() => {
    if (!isPlaying && autoTyping) {
      setAutoTyping(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (autoTypingInterval.current) {
        clearInterval(autoTypingInterval.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex justify-center space-x-8">
          <div className="text-center">
            <p className="text-musitype-gray text-sm">WPM</p>
            <p className="text-musitype-primary text-3xl font-mono">{stats.wpm}</p>
          </div>
          <div className="text-center">
            <p className="text-musitype-gray text-sm">ACCURACY</p>
            <p className="text-musitype-primary text-3xl font-mono">{stats.accuracy}%</p>
          </div>
        </div>
        
        <Toggle
          pressed={autoTyping}
          onPressedChange={setAutoTyping}
          disabled={!isPlaying || cursorPos >= charData.length}
          className="h-8 px-2 text-xs"
        >
          {autoTyping ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Toggle>
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
