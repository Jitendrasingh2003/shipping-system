import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    if (user) {
      socketInstance = io('http://localhost:5000', {
        withCredentials: true,
      });

      socketInstance.on('connect', () => {
        console.log('🔌 WebSocket connected:', socketInstance.id);
        socketInstance.emit('join:user', user.id);
      });

      // Request browser native notification permission on load
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Global event listener for in-app toast alerts
      socketInstance.on('notification', (data) => {
        // Native desktop notification fallback
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/vite.svg'
          });
        }

        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 border border-slate-800 shadow-glass-indigo rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}>
            <div className="flex-1 w-0">
              <p className="text-sm font-semibold text-indigo-400">{data.title}</p>
              <p className="mt-1 text-sm text-slate-300">{data.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="bg-transparent rounded-md text-slate-500 hover:text-slate-400 focus:outline-none"
              >
                ✕
              </button>
            </div>
          </div>
        ), { duration: 5000 });
      });

      // Support chat alert notification
      socketInstance.on('chat:new_message_alert', (data) => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Marine Bytes Support Desk`, {
            body: `New message from ${data.senderName}: "${data.message}"`,
            icon: '/vite.svg'
          });
        }
      });

      setSocket(socketInstance);
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
