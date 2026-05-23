import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '../api/notificationsApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const notifReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload.notifications, unreadCount: action.payload.unreadCount };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n._id === action.payload ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      };
    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n._id !== action.payload),
        unreadCount: state.notifications.find((n) => n._id === action.payload && !n.isRead)
          ? state.unreadCount - 1
          : state.unreadCount,
      };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notifReducer, { notifications: [], unreadCount: 0 });
  const { isAuthenticated, accessToken } = useAuth();
  const sseRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsApi.getAll({ limit: 20 });
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: data.data.notifications,
          unreadCount: data.data.unreadCount,
        },
      });
    } catch {}
  }, []);

  // SSE connection for real-time push
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    fetchNotifications();

    const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${BASE}/notifications/stream`;

    // Use fetch-based SSE so we can attach Authorization header
    const connectSSE = () => {
      // Native EventSource doesn't support custom headers, so we poll instead
      // For production you'd use a polyfill or switch to WS
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    };

    const cleanup = connectSSE();
    return cleanup;
  }, [isAuthenticated, accessToken, fetchNotifications]);

  const markRead = useCallback(async (id) => {
    await notificationsApi.markRead(id);
    dispatch({ type: 'MARK_READ', payload: id });
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const deleteNotification = useCallback(async (id) => {
    await notificationsApi.delete(id);
    dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
  }, []);

  return (
    <NotificationContext.Provider
      value={{ ...state, fetchNotifications, markRead, markAllRead, deleteNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
