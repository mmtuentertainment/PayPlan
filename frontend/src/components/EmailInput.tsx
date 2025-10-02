import { useState } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { SAMPLE_EMAILS } from '../lib/sample-emails';

interface EmailInputProps {
  onExtract: (text: string) => void;
  isExtracting: boolean;
}

export function EmailInput({ onExtract, isExtracting }: EmailInputProps) {
  const [text, setText] = useState('');
  const maxChars = 16000;

  const handleUseSample = () => {
    setText(SAMPLE_EMAILS);
  };

  const handleExtract = () => {
    if (text.trim()) {
      onExtract(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExtract();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label htmlFor="email-input" className="text-sm font-medium">
          Paste BNPL Payment Emails
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseSample}
          disabled={isExtracting}
        >
          Use Sample Emails
        </Button>
      </div>

      <Textarea
        id="email-input"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxChars))}
        onKeyDown={handleKeyDown}
        placeholder="Paste your BNPL payment reminder emails here..."
        className="min-h-[400px] font-mono text-sm"
        aria-label="Paste BNPL payment emails"
        disabled={isExtracting}
      />

      <div className="flex justify-between text-sm text-gray-500">
        <span>Tip: Press Cmd/Ctrl+Enter to extract</span>
        <span>{text.length} / {maxChars} chars</span>
      </div>

      <Button
        onClick={handleExtract}
        disabled={!text.trim() || isExtracting}
        className="w-full"
      >
        {isExtracting ? 'Extracting...' : 'Extract Payments'}
      </Button>
    </div>
  );
}
