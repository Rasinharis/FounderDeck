import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { initials } from '../../lib/format';
import { Loader2, LockKeyhole, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function Messages() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const requestedUser = searchParams.get('user');
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const activeUserId = activeUser?.id;

  const conversationUsers = useMemo(() => conversations.map((conversation) => conversation.user), [conversations]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.get('/messages/conversations')
      .then(async ({ data }) => {
        if (!isMounted) return;
        const items = data.data ?? [];
        setConversations(items);

        if (requestedUser) {
          const existing = items.find((item) => item.user?.id === requestedUser)?.user;
          if (existing) {
            setActiveUser(existing);
          } else {
            const profile = await api.get(`/profile/${requestedUser}`);
            if (isMounted) setActiveUser(profile.data.data);
          }
        } else if (items[0]?.user) {
          setActiveUser(items[0].user);
        }
      })
      .catch(() => toast.error('Could not load conversations.'))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [requestedUser]);

  useEffect(() => {
    if (!activeUserId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    api.get(`/messages/${activeUserId}`)
      .then(({ data }) => {
        if (isMounted) setMessages(data.data ?? []);
        return api.patch(`/messages/${activeUserId}/read`);
      })
      .catch(() => toast.error('Could not load this message thread.'));

    return () => {
      isMounted = false;
    };
  }, [activeUserId]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!activeUserId || !body.trim()) return;

    setIsSending(true);
    try {
      const { data } = await api.post(`/messages/${activeUserId}`, { body: body.trim() });
      setMessages((current) => [...current, data.data]);
      setBody('');
      setConversations((current) => {
        const withoutActive = current.filter((item) => item.user?.id !== activeUserId);
        return [{ user: activeUser, last_message_preview: data.data.body, unread_count: 0, last_message_at: data.data.created_at }, ...withoutActive];
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="text-[#111111]">
      <div className="grid gap-0 lg:grid-cols-[330px_1fr] border border-black/5 bg-white rounded-2xl overflow-hidden shadow-md min-h-[calc(100vh-160px)]">
        <aside className="border-b lg:border-b-0 lg:border-r border-black/5 bg-[#F4F4F4] flex flex-col">
          <div className="border-b border-black/5 p-5">
            <h1 className="text-xl font-display font-black text-[#111111] uppercase tracking-tight">Messages</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <LockKeyhole className="h-3.5 w-3.5 text-[#FF5C00]" /> Stored encrypted on the backend
            </p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#FF5C00]" />
              </div>
            ) : conversationUsers.length === 0 && !activeUser ? (
              <p className="p-5 text-sm font-semibold text-gray-400 leading-relaxed">No conversations yet. Open a pitch and message a founder.</p>
            ) : (
              <>
                {activeUser && !conversationUsers.some((item) => item.id === activeUser.id) && (
                  <ConversationButton user={activeUser} active onClick={() => setActiveUser(activeUser)} />
                )}
                {conversations.map((conversation) => (
                  <ConversationButton
                    key={conversation.user.id}
                    user={conversation.user}
                    preview={conversation.last_message_preview}
                    unread={conversation.unread_count}
                    active={conversation.user.id === activeUserId}
                    onClick={() => setActiveUser(conversation.user)}
                  />
                ))}
              </>
            )}
          </div>
        </aside>

        <section className="flex min-h-[75vh] flex-col bg-white">
          {activeUser ? (
            <>
              <div className="flex items-center gap-3 border-b border-black/5 p-5 bg-[#F9F9F9]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF5C00]/10 font-bold text-[#FF5C00]">
                  {initials(activeUser.name)}
                </div>
                <div>
                  <h2 className="font-bold text-[#111111] text-base">{activeUser.name}</h2>
                  <p className="text-xs font-bold text-[#FF5C00] uppercase tracking-wider">{activeUser.role}</p>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-6 bg-white max-h-[55vh]">
                {messages.length === 0 ? (
                  <div className="rounded-xl border border-black/5 bg-[#F4F4F4] p-5 text-sm font-semibold text-gray-500 leading-relaxed">
                    Start the conversation with a clear intro and next step.
                  </div>
                ) : messages.map((message) => {
                  const mine = message.sender_id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed ${mine ? 'bg-[#FF5C00] text-white rounded-tr-none shadow-[#FF5C00]/10' : 'bg-[#F4F4F4] border border-black/5 text-[#111111] rounded-tl-none'}`}>
                        <p className="whitespace-pre-wrap font-semibold">{message.body}</p>
                        <p className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${mine ? 'text-white/80' : 'text-gray-400'}`}>
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="border-t border-black/5 p-4 bg-[#F9F9F9]">
                <div className="flex gap-3">
                  <input
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Write a private message..."
                    className="h-11 flex-1 rounded-full border border-black/5 bg-white px-5 text-sm font-semibold outline-none focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] transition-shadow placeholder-gray-400 text-gray-800"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !body.trim()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#FF5C00] hover:bg-[#E65300] shadow-md shadow-[#FF5C00]/15 px-6 py-2 text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4" />}
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center font-semibold text-gray-400">Choose a conversation to begin.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function ConversationButton({ user, preview, unread = 0, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-black/5 p-4 text-left transition-all ${active ? 'bg-white border-l-4 border-l-[#FF5C00]' : 'hover:bg-black/5'}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF5C00]/10 text-sm font-bold text-[#FF5C00]">{initials(user.name)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-[#111111]">{user.name}</span>
        <span className="block truncate text-xs font-semibold text-gray-400">{preview || user.role}</span>
      </span>
      {unread > 0 && <span className="rounded-full bg-[#FF5C00] px-2 py-0.5 text-2xs font-bold text-white shadow-sm shadow-[#FF5C00]/20">{unread}</span>}
    </button>
  );
}
