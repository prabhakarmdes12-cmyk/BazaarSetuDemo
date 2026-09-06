'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { addToGuestCart } from '@/lib/guestCart';

interface ParsedItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  category: string;
}

const SAMPLE_CHIPS = [
  { label: '🥛 2 packet Amul milk & bread', phrase: '2 packet doodh aur ek packet bread' },
  { label: '🧅 1kg Pyaaz & 2kg Aalu', phrase: '1 kilo pyaaz aur 2 kilo aalu' },
  { label: '🍳 Fortune tel & Dettol sabun', phrase: 'Fortune tel aur Dettol sabun' },
];

export default function VoiceParchiSandbox() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [added, setAdded] = useState(false);

  // Simulated Voice recognition / Web Speech API
  const handleMicClick = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (SpeechRecognition) {
            const recognition = new (SpeechRecognition as any)();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      setRecognizedText('Sun rahe hain... Boliye!');

            recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRecognizedText(transcript);
        parsePhrase(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setRecognizedText('Awaz nahi suni gayi. Sample button dabayein!');
      };

      recognition.start();
    } else {
      // Fallback demo
      setIsListening(true);
      setRecognizedText('Sun rahe hain: "2 packet Amul milk aur bread"...');
      setTimeout(() => {
        setIsListening(false);
        parsePhrase('2 packet Amul doodh aur bread');
      }, 1500);
    }
  };

  const parsePhrase = (phrase: string) => {
    const lower = phrase.toLowerCase();
    const parsed: ParsedItem[] = [];

    if (lower.includes('doodh') || lower.includes('milk')) {
      parsed.push({
        productId: 'prod-milk-taaza',
        name: 'Amul Taaza Toned Milk 500ml',
        price: 33,
        unit: 'pouch',
        quantity: lower.includes('2') || lower.includes('do') ? 2 : 1,
        category: 'Dairy',
      });
    }
    if (lower.includes('bread')) {
      parsed.push({
        productId: 'prod-bread-modern',
        name: 'Modern White Bread 400g',
        price: 45,
        unit: 'pack',
        quantity: 1,
        category: 'Bakery',
      });
    }
    if (lower.includes('pyaaz') || lower.includes('onion')) {
      parsed.push({
        productId: 'prod-onion-1kg',
        name: 'Fresh Red Onions 1kg',
        price: 38,
        unit: 'kg',
        quantity: 1,
        category: 'Vegetables',
      });
    }
    if (lower.includes('aalu') || lower.includes('potato')) {
      parsed.push({
        productId: 'prod-potato-1kg',
        name: 'Fresh Jyoti Potato 1kg',
        price: 28,
        unit: 'kg',
        quantity: lower.includes('2') || lower.includes('do') ? 2 : 1,
        category: 'Vegetables',
      });
    }
    if (lower.includes('tel') || lower.includes('oil')) {
      parsed.push({
        productId: 'prod-oil-fortune',
        name: 'Fortune Kachi Ghani Mustard Oil 1L',
        price: 155,
        unit: 'bottle',
        quantity: 1,
        category: 'Oils',
      });
    }
    if (lower.includes('dettol') || lower.includes('sabun')) {
      parsed.push({
        productId: 'prod-dettol-soap',
        name: 'Dettol Original Bathing Soap 75g',
        price: 40,
        unit: 'pack',
        quantity: 1,
        category: 'Personal Care',
      });
    }

    if (parsed.length === 0) {
      // Default sample items
      parsed.push(
        { productId: 'prod-milk-taaza', name: 'Amul Taaza Toned Milk 500ml', price: 33, unit: 'pouch', quantity: 2, category: 'Dairy' },
        { productId: 'prod-bread-modern', name: 'Modern White Bread 400g', price: 45, unit: 'pack', quantity: 1, category: 'Bakery' }
      );
    }

    setItems(parsed);
    setAdded(false);
  };

  const handleTransferToCart = () => {
    items.forEach((item) => {
      addToGuestCart(
        {
          productId: item.productId,
          shopId: 'bighi-brothers-mart',
          shopName: 'Bighi Brothers Mart',
          name: item.name,
          price: item.price,
          unit: item.unit,
          image: '',
        },
        item.quantity
      );
    });
    setAdded(true);
    setTimeout(() => {
      router.push('/customer/cart');
    }, 600);
  };

  return (
    <div className="w-full bg-surface-container-low border border-primary/20 rounded-3xl p-6 shadow-lg space-y-5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-primary animate-ping" />
          <h3 className="font-headline font-bold text-base text-on-surface">Interactive Voice Parchi Sandbox</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">Try Speech-to-Cart</span>
      </div>

      <p className="text-sm text-on-surface-variant">
        Apni boli mein bolkar ya neeche sample chip dabakar dekhein — Paaska apne aap samaan aur Dhanbad rate pehchan leta hai:
      </p>

      {/* Mic trigger & live waveform */}
      <div className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-4">
        <button
          onClick={handleMicClick}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            isListening ? 'bg-error text-white animate-pulse' : 'leaf-gradient text-white'
          }`}
        >
          <Icon name={isListening ? 'mic' : 'mic_none'} size="lg" />
        </button>
        <span className="text-xs font-semibold text-on-surface-variant">
          {isListening ? 'Sun rahe hain... Bolte rahein' : 'Mic dabayein: "Bhaiya, do packet doodh aur bread"'}
        </span>

        {/* 21-bar wave visualizer simulation */}
        {isListening && (
          <div className="flex items-center gap-1 h-6">
            {[...Array(21)].map((_, i) => (
              <span
                key={i}
                className="w-1 bg-primary rounded-full animate-bounce"
                style={{
                  height: `${10 + ((i * 7) % 20)}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}

        {recognizedText && (
          <div className="text-xs italic text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-lg text-center">
            &ldquo;{recognizedText}&rdquo;
          </div>
        )}
      </div>

      {/* Sample chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ya 1-Click Sample Dabayein:</span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setRecognizedText(chip.phrase);
                parsePhrase(chip.phrase);
              }}
              className="text-xs px-3 py-2 bg-surface-container-lowest border border-outline-variant/25 rounded-xl font-medium text-on-surface hover:border-primary transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parsed basket preview */}
      {items.length > 0 && (
        <div className="pt-3 border-t border-outline-variant/15 space-y-3 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-on-surface">Pahchane Gaye Items ({items.length}):</span>
            <span className="text-xs text-primary font-bold">
              Total: ₹{items.reduce((s, i) => s + i.price * i.quantity, 0)}
            </span>
          </div>

          <div className="space-y-1.5">
            {items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2 bg-surface-container-lowest rounded-lg">
                <span className="font-medium text-on-surface">
                  {it.name} <span className="text-on-surface-variant font-bold">x {it.quantity}</span>
                </span>
                <span className="font-bold text-on-surface">₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleTransferToCart}
            disabled={added}
            className="w-full py-3 rounded-xl leaf-gradient text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {added ? (
              <>
                <Icon name="check" size="sm" />
                <span>Cart Mein Add Ho Gaya! Opening Cart...</span>
              </>
            ) : (
              <>
                <Icon name="shopping_cart" size="sm" />
                <span>Samaan Cart Mein Dalein & Order Karein ➔</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
