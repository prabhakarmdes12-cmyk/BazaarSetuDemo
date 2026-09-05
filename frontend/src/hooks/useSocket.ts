'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { Message, TypingUser } from '@/types';

type Handler = (data: any) => void;

// Any listener registered before the socket connects must be preserved and
// attached the moment the socket exists. A plain "register on socketRef" pattern
// silently drops listeners registered during mount (before the connect effect runs).
export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef<Record<string, Set<Handler>>>({});

  const subscribe = useCallback((event: string, handler: Handler) => {
    if (!handlersRef.current[event]) handlersRef.current[event] = new Set();
    handlersRef.current[event].add(handler);
    // If the socket already exists, attach immediately too.
    socketRef.current?.on(event, handler);
    return () => {
      handlersRef.current[event]?.delete(handler);
      socketRef.current?.off(event, handler);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    socketRef.current = socket;
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    // Attach any handlers that registered before the socket was created.
    for (const [event, set] of Object.entries(handlersRef.current)) {
      for (const handler of Array.from(set)) socket.on(event, handler);
    }
    return () => {
      disconnectSocket();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  const joinChat = useCallback((chatId: string) => {
    socketRef.current?.emit('join_chat', { chatId });
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    socketRef.current?.emit('leave_chat', { chatId });
  }, []);

  const sendMessage = useCallback((chatId: string, content: string, type: string = 'TEXT') => {
    socketRef.current?.emit('send_message', { chatId, content, type });
  }, []);

  const sendProductMessage = useCallback((chatId: string, product: { name: string; price: number; unit: string; image?: string }) => {
    socketRef.current?.emit('send_product_message', { chatId, product });
  }, []);

  const sendTyping = useCallback((chatId: string) => {
    socketRef.current?.emit('typing', { chatId });
  }, []);

  const sendStopTyping = useCallback((chatId: string) => {
    socketRef.current?.emit('stop_typing', { chatId });
  }, []);

  const markRead = useCallback((chatId: string) => {
    socketRef.current?.emit('mark_read', { chatId });
  }, []);

  const onMessage = useCallback(
    (callback: (message: Message) => void) => subscribe('new_message', callback as Handler),
    [subscribe],
  );

  const onChatUpdated = useCallback(
    (callback: (data: unknown) => void) => subscribe('chat_updated', callback as Handler),
    [subscribe],
  );

  const onTyping = useCallback(
    (callback: (data: TypingUser) => void) => subscribe('user_typing', callback as Handler),
    [subscribe],
  );

  const onStopTyping = useCallback(
    (callback: (data: { userId: string; chatId: string }) => void) => subscribe('user_stop_typing', callback as Handler),
    [subscribe],
  );

  const onMessagesRead = useCallback(
    (callback: (data: { chatId: string; readBy: string }) => void) => subscribe('messages_read', callback as Handler),
    [subscribe],
  );

  const onNotification = useCallback(
    (callback: (data: { type: string; orderId?: string; chatId?: string }) => void) => subscribe('notification', callback as Handler),
    [subscribe],
  );

  return {
    isConnected,
    joinChat, leaveChat, sendMessage, sendProductMessage,
    sendTyping, sendStopTyping, markRead,
    onMessage, onChatUpdated, onTyping, onStopTyping, onMessagesRead, onNotification,
  };
}
