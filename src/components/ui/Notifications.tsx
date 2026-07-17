import { useEffect, useState, useCallback } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link: string | null;
  created_at: string;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications((data as Notification[]) ?? []);
      setUnreadCount((data ?? []).filter((n) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const typeStyles = {
    info: 'border-blue-600/30',
    success: 'border-forest-600/30',
    warning: 'border-orange-600/30',
    error: 'border-red-600/30',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-dark-700 border border-dark-300 z-50 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-dark-300">
              <h3 className="text-white font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-gold-500 hover:text-gold-400"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-dark-500 border-t-gold-600 rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-2 ${typeStyles[notification.type]} ${
                      !notification.read ? 'bg-dark-600/50' : ''
                    } hover:bg-dark-600/30 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-gold-500 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-gray-600 text-xs mt-2">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-500 hover:text-forest-400 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-IN');
}
