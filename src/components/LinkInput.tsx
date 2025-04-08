
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LinkInputProps {
  onVideoIdSubmit: (videoId: string) => void;
}

const LinkInput: React.FC<LinkInputProps> = ({ onVideoIdSubmit }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setIsLoading(true);
    
    const videoId = extractYoutubeId(inputValue);
    if (!videoId) {
      toast.error('Invalid YouTube URL');
      setIsLoading(false);
      return;
    }

    onVideoIdSubmit(videoId);
    setInputValue('');
    
    setTimeout(() => {
      setIsLoading(false);
      toast.success('YouTube video loaded!');
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-lg mx-auto">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Paste YouTube music video URL"
        className="flex-1 bg-musitype-dark border-gray-700 text-musitype-light focus:border-musitype-primary"
      />
      <Button 
        type="submit" 
        className="bg-musitype-primary text-musitype-darker hover:bg-musitype-primary/90"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Load Music'
        )}
      </Button>
    </form>
  );
};

export default LinkInput;
