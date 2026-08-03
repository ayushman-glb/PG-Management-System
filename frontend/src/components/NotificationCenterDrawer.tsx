import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck } from 'lucide-react';
import { useSocketEvent } from '../services/socket';
import { useTheme } from '../theme';

interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange
}) => {
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 'notif-1',
      title: 'Room Change Request Submitted',
      message: 'Rahul Sharma requested room transfer to Single Sharing AC',
      type: 'ROOM_TRANSFER',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-2',
      title: 'Bed Allotment Update',
      message: 'Bed 102-B marked as HOLD for maintenance',
      type: 'BED_HOLD',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'notif-3',
      title: 'Monthly Rent Invoice Generated',
      message: 'August 2026 rent invoice generated for Room 101 Bed 101-A',
      type: 'BILLING',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]);
  const { darkMode } = useTheme();

  // Real-time notifications via Socket.IO
  useSocketEvent('transfer:requested', (data) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'New Room Transfer Request',
      message: `${data.resident?.name || 'Resident'} submitted a room change request`,
      type: 'ROOM_TRANSFER',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);
  });

  useSocketEvent('resident:status_updated', (data) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Resident Status Changed',
      message: `${data.residentName || 'Resident'} status changed to ${data.status}`,
      type: 'RESIDENT_STATUS',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (!isOpen) return null;

  const drawerBg = darkMode ? "bg-neutral-900 border-white/10 text-white" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24]";
  const textPrimary = darkMode ? "text-white" : "text-[#3B2A24]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[#6E5A52]";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`w-full max-w-full sm:max-w-md h-full border-l p-4 sm:p-6 shadow-2xl flex flex-col overflow-hidden ${drawerBg}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 relative">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>Notification Center</h3>
                <p className={`text-xs ${textMuted}`}>Live alerts & workflow updates</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${darkMode ? "bg-neutral-800 text-neutral-400 hover:text-white" : "bg-[#F8EEE5] text-[#6E5A52] hover:text-[#3B2A24]"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-4">
            <span className={`text-xs font-semibold ${textMuted}`}>{unreadCount} Unread Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-amber-500 font-bold hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                  n.isRead
                    ? darkMode
                      ? 'bg-neutral-800/40 border-white/5 opacity-70'
                      : 'bg-[#F8EEE5]/60 border-[#E6D7CA] opacity-70'
                    : darkMode
                      ? 'bg-neutral-800/90 border-amber-500/30 shadow-lg'
                      : 'bg-[#FFFDFB] border-[#D9A87C] shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <h4 className={`font-bold text-sm ${textPrimary}`}>{n.title}</h4>
                  </div>
                  <span className={`text-[10px] ${textMuted}`}>
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-xs pl-4 ${textMuted}`}>{n.message}</p>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className={`h-64 flex flex-col items-center justify-center text-center space-y-2 ${textMuted}`}>
                <Bell className="w-8 h-8 opacity-40" />
                <p className="text-xs">No notifications yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

