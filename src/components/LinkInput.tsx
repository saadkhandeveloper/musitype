
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface LinkInputProps {
  onVideoIdSubmit: (videoId: string) => void;
}

const LinkInput: React.FC<LinkInputProps> = ({ onVideoIdSubmit }) => {
  const [inputValue, setInputValue] = useState('');

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

    const videoId = extractYoutubeId(inputValue);
    if (!videoId) {
      toast.error('Invalid YouTube URL');
      return;
    }

    onVideoIdSubmit(videoId);
    setInputValue('');
    toast.success('YouTube video loaded!');
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
      >
        Load Music
      </Button>
    </form>
  );
};

export default LinkInput;
