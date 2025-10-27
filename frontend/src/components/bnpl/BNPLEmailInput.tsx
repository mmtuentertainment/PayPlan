/**
 * BNPL Email Input Component
 *
 * Allows users to paste BNPL purchase confirmation emails for parsing.
 * Includes:
 * - Text area for email content
 * - Sample email button (for testing)
 * - Parse button
 * - Character counter
 * - Keyboard shortcuts (Cmd/Ctrl+Enter)
 * - WCAG 2.1 AA accessibility compliance
 */

import { useState } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

interface BNPLEmailInputProps {
  onParse: (emailContent: string) => void;
  isParsing: boolean;
  hasParsedData: boolean;
}

export function BNPLEmailInput({
  onParse,
  isParsing,
  hasParsedData,
}: BNPLEmailInputProps) {
  const [emailContent, setEmailContent] = useState('');
  const maxChars = 16000;

  const handleParse = () => {
    if (emailContent.trim()) {
      onParse(emailContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcut: Cmd/Ctrl+Enter to parse
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleParse();
    }
  };

  const handleUseSample = () => {
    // Sample Klarna email for testing
    setEmailContent(`Subject: Your purchase at Target

Your purchase at Target for $200.00 in 4 payments

Thank you for your order! Here's your payment schedule:

Payment 1: $50.00 due November 1, 2025
Payment 2: $50.00 due November 15, 2025
Payment 3: $50.00 due November 29, 2025
Payment 4: $50.00 due December 13, 2025

Total: $200.00

Questions? Visit klarna.com/support
`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label htmlFor="bnpl-email-input" className="text-sm font-medium">
          Paste BNPL Purchase Confirmation Email
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseSample}
          disabled={isParsing}
          aria-label="Fill with sample Klarna email for testing"
        >
          Use Sample Email
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 bg-blue-50">
        <p className="text-sm text-gray-700">
          <strong>Supported providers:</strong> Klarna, Affirm, Afterpay, Sezzle,
          Zip, PayPal Credit
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Paste a <strong>purchase confirmation email</strong> (not promotional or
          shipping emails). We'll extract your payment schedule automatically.
        </p>
      </div>

      <Textarea
        id="bnpl-email-input"
        value={emailContent}
        onChange={(e) => setEmailContent(e.target.value.slice(0, maxChars))}
        onKeyDown={handleKeyDown}
        placeholder="Paste your BNPL purchase confirmation email here...

Example:
Subject: Your purchase at Best Buy

Your Affirm purchase of $500.00 at Best Buy

6 monthly payments of $83.33
First payment: November 1, 2025
APR: 0%"
        className="min-h-[400px] font-mono text-sm"
        aria-label="Paste BNPL purchase confirmation email"
        disabled={isParsing}
      />

      <div className="flex justify-between text-sm text-gray-500">
        <span>Tip: Press Cmd/Ctrl+Enter to parse</span>
        <span>
          {emailContent.length} / {maxChars} chars
        </span>
      </div>

      <Button
        onClick={handleParse}
        disabled={!emailContent.trim() || isParsing}
        className="w-full"
        aria-busy={isParsing}
      >
        {isParsing ? 'Parsing Email...' : 'Parse Email'}
      </Button>

      {isParsing && (
        <span className="sr-only" aria-live="polite">
          Parsing BNPL email to extract payment schedule...
        </span>
      )}

      {hasParsedData && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            ✓ Payment schedule extracted successfully! Review the details below
            before saving.
          </p>
        </div>
      )}
    </div>
  );
}
