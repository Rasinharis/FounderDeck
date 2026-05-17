import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Bell, CheckCheck, Handshake, Loader2, MessageSquare, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

const iconByType = {
  post_upvoted: ThumbsUp,
  new_comment: MessageSquare,
  new_message: MessageSquare,
  new_collab_request: Handshake,
  collab_accepted: Handshake,
  collab_rejected: Handshake,
};

const titleByType = {
  post_upvoted: 'New upvote',
  new_comment: 'New comment',
  new_message: 'New message',
  new_collab_request: 'New collaboration request',
  collab_accepted: 'Collaboration accepted',
  collab_rejected: 'Collaboration rejected',
};

function describeNotification(notification) {
  const data = notification.data ?? {};
  if (notification.type === 'post_upvoted') return `${data.actor_name} upvoted "${data.post_title}".`;
  if (notification.type === 'new_comment') return `${data.actor_name} commented on "${data.post_title}".`;
  if (notification.type === 'new_message') return `${data.sender_name} sent you a private message.`;
  if (notification.type === 'new_collab_request') return `${data.sender_name} requested to collaborate on "${data.post_title}".`;
  if (notification.type === 'collab_accepted') return `${data.entrepreneur_name} accepted your request for "${data.post_title}".`;
  if (notification.type === 'collab_rejected') return `${data.entrepreneur_name} rejected your request for "${data.post_title}".`;
  return 'You have a new update.';
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data ?? []);
    } catch {
      toast.error('Could not load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() })));
    } catch {
      toast.error('Could not mark notifications as read.');
    }
  };

  const markOneRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await api.patch(`/notifications/${notification.id}/read`);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
        )
      );
    } catch {
      // non-critical, silent fail
    }
  };

  return (
    <main className="min-h-screen bg-[#EAEAEA] px-4 pt-28 pb-12 text-[#111111]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-black text-[#111111]">Notifications</h1>
            <p className="mt-1 text-sm font-semibold text-gray-500">Votes, comments, collaboration requests, and messages in one place.</p>
          </div>
          <button type="button" onClick={markAllRead} className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-[#F4F4F4]/50 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-[#FF5C00]/40">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF5C00]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 text-gray-400" />
              <p className="text-sm font-semibold text-gray-500">No notifications yet.</p>
            </div>
          ) : notifications.map((notification) => {
            const Icon = iconByType[notification.type] ?? Bell;
            return (
              <article
                key={notification.id}
                onClick={() => markOneRead(notification)}
                className={`flex gap-4 border-b border-black/5 p-5 last:border-b-0 transition-colors ${notification.is_read ? 'bg-white' : 'bg-[#FF5C00]/5 cursor-pointer hover:bg-[#FF5C00]/10'}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF5C00]/10 text-[#FF5C00]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-display font-bold text-gray-800">{titleByType[notification.type] ?? 'Update'}</h2>
                    <span className="text-xs font-semibold text-gray-400">{new Date(notification.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-500 leading-6">{describeNotification(notification)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
