'use client';

import React, { useState } from 'react';
import { Icon } from './ui';

interface SearchBarProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: () => void;
  /** Opens the Paaska Sahayak voice parchi sheet. */
  onVoiceSearch?: () => void;
  placeholder?: string;
  /** Mirrors the parent's recording state so the mic reads as live. */
  voiceActive?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  onVoiceSearch,
  placeholder = 'Kya chahiye? (milk, bread...)',
  voiceActive = false,
  inputRef,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const handleVoice = () => {
    setPulsing(true);
    onVoiceSearch?.();
    window.setTimeout(() => setPulsing(false), 1200);
  };

  const listening = voiceActive || pulsing;

  return (
    <section className="mb-8">
      <div
        className={`relative group rounded-2xl transition-all duration-300 ${
          focused ? 'shadow-leaf-glow' : ''
        }`}
      >
        <div
          className={`absolute -inset-px rounded-2xl transition-opacity duration-300 pointer-events-none leaf-gradient opacity-0 ${
            focused ? 'opacity-40' : ''
          }`}
        />
        <div className="relative flex items-center bg-surface-container-low border border-outline-variant/40 rounded-2xl overflow-hidden">
          <div className="pl-5 pr-2 flex items-center pointer-events-none">
            <Icon
              name="search"
              className={`transition-colors duration-200 ${focused ? 'text-primary' : 'text-on-surface-variant/60'}`}
            />
          </div>
          <input
            ref={inputRef}
            className="w-full bg-transparent border-none py-5 pl-1 pr-2 text-on-surface focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/50 transition-all"
            placeholder={placeholder}
            type="text"
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' && onSearch) onSearch(); }}
          />
          <button
            onClick={handleVoice}
            aria-label="Bol kar order karein — Paaska Sahayak"
            title="Bol kar order karein"
            className={`mx-1.5 flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 active:scale-90 ${
              listening
                ? 'bg-primary text-white shadow-leaf-glow animate-pulse-ring'
                : 'text-on-surface-variant/70 hover:text-primary hover:bg-primary/10'
            }`}
          >
            <Icon name="mic" size="sm" filled={listening} />
          </button>
          <button
            onClick={onSearch}
            className="mr-2 bg-gradient-to-br from-primary to-secondary text-white px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform shadow-brand-glow"
          >
            Search
          </button>
        </div>
      </div>
    </section>
  );
}
