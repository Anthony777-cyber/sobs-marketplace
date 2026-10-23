import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { Loader2, LogOut } from 'lucide-react';
import { setHead } from '@/lib/head';

const GLOBAL_KEY_STORAGE = 'sobs_global_user_key';
const MUTED_CONVERSATIONS_KEY = 'sobs_muted_chat_conversations';

function sellerHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-SOBS-Global-Key': sessionStorage.getItem(GLOBAL_KEY_STORAGE) || localStorage.getItem(GLOBAL_KEY_STORAGE) || '',
    'X-SOBS-Seller-Session': sessionStorage.getItem('sobs_seller_session_token') || localStorage.getItem('sobs_seller_session_token') || '',
  };
}

export default function MutedChatsPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unmutingId, setUnmutingId] = useState('');
  const [activeConversationId, setActiveConversationId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setHead('Muted Chats — S.O.B.S.', 'Manage muted buyer conversations.');
    const sellerSession = sessionStorage.getItem('sobs_seller_session_token');
    const globalKey = sessionStorage.getItem(GLOBAL_KEY_STORAGE);
    if (!sellerSession) {
      navigate('/seller-login', { replace: true, state: { returnTo: '/manage/muted-chats' } });
      return;
    }
    if (!globalKey || sessionStorage.getItem('sobs_management_unlocked') !== 'true') {
      navigate('/manage-listings', { replace: true });
      return;
    }

    let active = true;
    const loadMutedConversations = async () => {
      try {
        if (!import.meta.env.DEV) {
          const verification = await fetch('/api/manage/global/verify', { method: 'POST', headers: sellerHeaders() });
          if (!verification.ok) throw new Error('Management verification failed.');
        }
        const response = await fetch('/api/seller/chats', { headers: sellerHeaders() });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load muted chats.');
        const localMuted = JSON.parse(localStorage.getItem(MUTED_CONVERSATIONS_KEY) || '{}');
        if (active) {
          setConversations((data.conversations || []).filter((conversation) =>
            localMuted[conversation.conversation_id] || conversation.is_blocked
          ));
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Could not load muted chats.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadMutedConversations();
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    if (!activeConversationId) return undefined;
    const timer = window.setTimeout(() => {
      setConversations((current) => current.filter((item) => item.conversation_id !== activeConversationId));
      setActiveConversationId('');
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [activeConversationId]);

  const unmuteConversation = async (conversation) => {
    setUnmutingId(conversation.conversation_id);
    setError('');
    try {
      const response = await fetch(`/api/seller/chats/${encodeURIComponent(conversation.conversation_id)}`, {
        method: 'POST',
        headers: sellerHeaders(),
        body: JSON.stringify({ action: 'unblock' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not unmute this conversation.');
      const localMuted = JSON.parse(localStorage.getItem(MUTED_CONVERSATIONS_KEY) || '{}');
      delete localMuted[conversation.conversation_id];
      localStorage.setItem(MUTED_CONVERSATIONS_KEY, JSON.stringify(localMuted));
      setActiveConversationId(conversation.conversation_id);
    } catch (unmuteError) {
      setError(unmuteError.message || 'Could not unmute this conversation.');
    } finally {
      setUnmutingId('');
    }
  };

  return <div className="min-h-screen bg-black text-white">
    <NavBar />
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-12 sm:pt-[10vh]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl tracking-tight">Muted chats</h1>
        <button type="button" onClick={() => navigate('/manage/chats')} className="inline-flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          <LogOut className="management-exit-icon h-3.5 w-3.5" />
          Chats
        </button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-500 p-3 text-sm text-red-300">{error}</p>}
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : conversations.length === 0 ? <section className="rounded-xl border-2 border-white p-5 text-sm text-gray-300">No muted conversations.</section>
          : <section className="space-y-3">
            {conversations.map((conversation) => <div key={conversation.conversation_id} className="flex items-center gap-3 rounded-xl border-2 border-white p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{conversation.buyer_name || 'Buyer'}</p>
                <p className="truncate text-sm text-gray-300">{conversation.listing_title || `Listing ${conversation.listing_id}`}</p>
                {conversation.last_message && <p className="mt-1 truncate text-sm text-gray-400">{conversation.last_message}</p>}
              </div>
              <button type="button" onClick={() => unmuteConversation(conversation)} disabled={Boolean(unmutingId) || activeConversationId === conversation.conversation_id} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-white disabled:opacity-70 ${activeConversationId === conversation.conversation_id ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {unmutingId === conversation.conversation_id ? 'Unmuting…' : activeConversationId === conversation.conversation_id ? 'Active' : 'Muted'}
              </button>
            </div>)}
          </section>}
    </main>
  </div>;
}
