'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Message, Product } from '@/types';
import ProductCard from './ProductCard';
import { Icon } from '@/components/ui';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onSendProduct: (product: { name: string; price: number; unit: string; image?: string }) => void;
  onSendVoiceNote?: (audio: Blob, meta: { mimeType: string; durationMs: number }) => Promise<void> | void;
  onAddToCart?: (product: Product) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onMarkRead?: () => void;
  isOtherTyping?: boolean;
  currentUserRole: 'customer' | 'vendor';
  isConnected: boolean;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  onSendProduct,
  onSendVoiceNote,
  onAddToCart,
  onTyping,
  onStopTyping,
  onMarkRead,
  isOtherTyping,
  currentUserRole,
  isConnected,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productUnit, setProductUnit] = useState('kg');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when they come in
  useEffect(() => {
    if (messages.length > 0 && onMarkRead) {
      const timer = setTimeout(onMarkRead, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, onMarkRead]);

  useEffect(() => () => {
    mediaRecorderRef.current?.stop?.();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const handleVoiceToggle = async () => {
    if (!onSendVoiceNote || isUploadingVoice) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      window.alert('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: preferredType });
      audioChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const durationMs = Date.now() - recordingStartedAtRef.current;
        const mimeType = recorder.mimeType || preferredType;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setIsUploadingVoice(true);
        try {
          await onSendVoiceNote(audioBlob, { mimeType, durationMs });
        } finally {
          setIsUploadingVoice(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Voice recording failed:', err);
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
    if (onStopTyping) onStopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (onTyping) {
      onTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (onStopTyping) onStopTyping();
      }, 2000);
    }
  };

  const handleSendProduct = () => {
    if (!productName.trim() || !productPrice) return;
    onSendProduct({
      name: productName.trim(),
      price: parseFloat(productPrice),
      unit: productUnit,
    });
    setProductName('');
    setProductPrice('');
    setProductUnit('kg');
    setShowProductForm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by time (gap > 30 min = new group)
  const groupedMessages: { time: string; messages: Message[] }[] = [];
  let currentGroup: Message[] = [];
  let lastTimeMs: number | null = null;

  messages.forEach((msg) => {
    const msgTime = new Date(msg.createdAt).getTime();
    if (lastTimeMs !== null && (msgTime - lastTimeMs) > 30 * 60 * 1000) {
      groupedMessages.push({
        time: new Date(lastTimeMs).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
        messages: currentGroup,
      });
      currentGroup = [];
    }
    currentGroup.push(msg);
    lastTimeMs = msgTime;
  });
  if (currentGroup.length > 0 && lastTimeMs !== null) {
    groupedMessages.push({
      time: new Date(lastTimeMs).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
      messages: currentGroup,
    });
  }

  const getMessagePayload = (msg: Message) => (msg.payload || {}) as {
    audioUrl?: string;
    transcript?: string;
    transcriptionConfidence?: number;
    requiresManualReview?: boolean;
    duration?: number;
    startedAt?: string;
    endedAt?: string | null;
    status?: string;
    draftId?: string;
    items?: Array<{ requestedName?: string; quantity?: number; unit?: string; availabilityStatus?: string; catalogPrice?: number; quotedPrice?: number }>;
    subtotal?: number;
    deliveryFee?: number;
    finalTotal?: number;
    totalAmount?: number;
    amount?: number;
  };

  const renderCommerceMessage = (msg: Message) => {
    const payload = getMessagePayload(msg);
    const isCommerce = String(msg.type).startsWith('BAZAAR.') || String(msg.type).startsWith('CHITIGRAM.');
    if (!isCommerce) return null;

    const label = String(msg.type).replace('BAZAAR.', '').replace('CHITIGRAM.', '').replace(/_/g, ' ');
    const isCallRecord = msg.type === 'CHITIGRAM.CALL_RECORD';
    return (
      <div className="space-y-2 rounded-2xl bg-primary-fixed/70 border border-primary/20 p-3 text-on-primary-fixed shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Icon name={isCallRecord ? 'call' : 'shopping_bag'} size="sm" />
          {label}
        </div>
        {isCallRecord ? (
          <div className="rounded-xl bg-surface-container-lowest/80 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">{payload.status || 'CALL'}</span>
              <span className="text-on-surface-variant">{payload.duration || 0}s</span>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">
              {payload.startedAt ? new Date(payload.startedAt).toLocaleString('en-IN') : new Date(msg.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
        )}
        {Array.isArray(payload.items) && payload.items.length > 0 && (
          <div className="space-y-1 rounded-xl bg-surface-container-lowest/80 p-2">
            {payload.items.slice(0, 6).map((item, index) => (
              <div key={`${item.requestedName || 'item'}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium truncate">{item.requestedName || 'Item'} · {item.quantity || 1} {item.unit || 'pc'}</span>
                <span className="text-on-surface-variant whitespace-nowrap">
                  {item.quotedPrice || item.catalogPrice ? `₹${item.quotedPrice || item.catalogPrice}` : item.availabilityStatus || 'check'}
                </span>
              </div>
            ))}
          </div>
        )}
        {(payload.finalTotal || payload.totalAmount || payload.amount) && (
          <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest/80 px-3 py-2 text-sm font-bold">
            <span>Total</span>
            <span>₹{payload.finalTotal || payload.totalAmount || payload.amount}</span>
          </div>
        )}
      </div>
    );
  };

  const renderVoiceMessage = (msg: Message) => {
    const payload = getMessagePayload(msg);
    if (msg.type !== 'VOICE_ORDER' && !payload.audioUrl) return null;

    return (
      <div className="space-y-2 rounded-2xl border border-secondary/20 bg-secondary-container/30 p-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-secondary">
          <Icon name="mic" size="sm" />
          Voice grocery order
        </div>
        {payload.audioUrl && (
          <audio controls src={payload.audioUrl} className="w-full h-9" preload="metadata">
            <track kind="captions" />
          </audio>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">
          {payload.transcript || msg.content || 'Voice note received — transcription pending'}
        </p>
        {payload.requiresManualReview && (
          <p className="rounded-lg bg-warning-container/40 px-2 py-1 text-[11px] font-semibold text-on-surface-variant">
            Transcription ambiguous — merchant can play the original audio.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection status */}
      <div className={`text-center py-1 text-xs ${isConnected ? 'text-success' : 'text-error'}`}>
        {isConnected ? '● Connected' : '● Connecting...'}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 py-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Icon name="chat_bubble" size="xl" className="text-on-surface-variant mb-3" />
            <p className="text-on-surface-variant text-sm">Baatcheet shuru karein!</p>
            <p className="text-on-surface-variant text-xs mt-1">
              {currentUserRole === 'vendor'
                ? 'Customer ko product bhejein'
                : 'Products, prices ke baare mein poochein'}
            </p>
          </div>
        )}

        {groupedMessages.map((group, gi) => (
          <div key={gi}>
            {/* Time separator */}
            <div className="text-center py-2">
              <span className="text-[10px] text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">{group.time}</span>
            </div>

            {group.messages.map((msg) => {
              const senderRole = msg.senderRole === 'CUSTOMER'
                ? 'customer'
                : msg.senderRole === 'MERCHANT'
                  ? 'vendor'
                  : msg.senderRole;
              const isOwnMessage = senderRole === currentUserRole;
              const showReadStatus = isOwnMessage && msg.isRead !== undefined;
              const voiceMessage = renderVoiceMessage(msg);
              const commerceMessage = renderCommerceMessage(msg);

              return (
                <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1.5`}>
                  <div className={isOwnMessage ? 'chat-bubble-vendor' : 'chat-bubble-customer'}>
                    {voiceMessage || commerceMessage || (msg.type === 'PRODUCT' && msg.product ? (
                      <div className="space-y-2">
                        <p className="text-xs text-on-surface-variant mb-1">
                          {isOwnMessage ? 'Product share kiya' : 'Product aaya'}
                        </p>
                        <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {msg.product.image ? (
                                <Image fill sizes="48px" src={msg.product.image} alt={msg.product.name} className="object-cover rounded-lg" />
                              ) : (
                                <Icon name="shopping_cart" size="md" className="text-on-surface-variant" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-on-surface text-sm">{msg.product.name}</p>
                              <p className="text-primary font-bold text-sm">₹{msg.product.price}/{msg.product.unit}</p>
                            </div>
                          </div>
                          {onAddToCart && !isOwnMessage && (
                            <button onClick={() => onAddToCart(msg.product!)} className="w-full mt-2 btn-primary !py-2 !text-sm">
                              Cart mein daalein
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    ))}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className="text-[10px] text-on-surface-variant">
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {showReadStatus && (
                        <span className={`text-[10px] ${msg.isRead ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {msg.isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="chat-bubble-customer !px-4 !py-2">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Product form (vendor only) */}
      {showProductForm && currentUserRole === 'vendor' && (
        <div className="border-t border-outline-variant bg-surface-container-lowest p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-on-surface text-sm">Quick Product</h4>
            <button onClick={() => setShowProductForm(false)} className="text-on-surface-variant text-sm">Cancel</button>
          </div>
          <input type="text" placeholder="Product name (e.g., Aata)" value={productName}
            onChange={(e) => setProductName(e.target.value)} className="input-field !py-2 text-sm" />
          <div className="flex gap-2">
            <input type="number" placeholder="Price" value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)} className="input-field !py-2 text-sm flex-1" />
            <select value={productUnit} onChange={(e) => setProductUnit(e.target.value)} className="input-field !py-2 text-sm w-24">
              <option value="kg">kg</option><option value="g">g</option><option value="L">L</option>
              <option value="ml">ml</option><option value="pcs">pcs</option><option value="dozen">dozen</option><option value="pack">pack</option>
            </select>
          </div>
          <button onClick={handleSendProduct} disabled={!productName.trim() || !productPrice} className="w-full btn-primary !py-2 text-sm">
            Product Bhejein
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-outline-variant bg-surface-container-lowest p-3 safe-bottom">
        <div className="flex items-center gap-2">
          {currentUserRole === 'vendor' && (
            <button onClick={() => setShowProductForm(!showProductForm)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                showProductForm ? 'bg-primary text-white' : 'bg-primary-container text-primary'
              }`}>
              <Icon name="add" size="sm" />
            </button>
          )}
          {onSendVoiceNote && currentUserRole === 'customer' && (
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={isUploadingVoice}
              aria-label={isRecording ? 'Stop voice order recording' : 'Record voice order'}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50 ${
                isRecording ? 'bg-error text-white animate-pulse' : 'bg-secondary-container text-secondary'
              }`}
            >
              <Icon name={isUploadingVoice ? 'hourglass_top' : isRecording ? 'stop' : 'mic'} size="sm" />
            </button>
          )}
          <input type="text" placeholder={isRecording ? 'Recording voice order...' : 'Message likhein...'} value={input}
            onChange={handleInputChange} onKeyDown={handleKeyDown} className="input-field !py-2.5 text-sm" />
          <button onClick={handleSend} disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 hover:bg-primary-dark transition-colors disabled:opacity-50">
            <Icon name="send" size="sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
