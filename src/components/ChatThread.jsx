import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getUserName, getSessionId } from '@/lib/user';
import { Send } from 'lucide-react';

export default function ChatThread({ listingId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const endRef = useRef(null);

  useEffect(() => {
    getUserName().then(setUserName);
    base44.entities.ChatMessage.filter({ listing_id: listingId }, 'created_date', 200).then(setMessages);
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.listing_id === listingId) {
        setMessages((prev) => [...prev, event.data]);
      }
    });
    return unsubscribe;
  }, [listingId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await base44.entities.ChatMessage.create({
        listing_id: listingId,
        sender_id: getSessionId(),
        sender_name: userName,
        message: input.trim(),
      });
      setInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      <div className="border-b p-3 text-sm font-medium">Chat with the seller</div>
      <div className="max-h-80 min-h-48 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{m.sender_name}: </span>
            <span className="text-muted-foreground">{m.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={send}
          disabled={sending}
          className="inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}