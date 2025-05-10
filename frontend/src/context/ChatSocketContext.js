// 📄 src/context/ChatSocketContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const ChatSocketContext = createContext();

export const ChatSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socket = new WebSocket("ws://localhost:8000/ws/chat");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("🌐 [Global WS] connected");
      setConnected(true);
    };

    socket.onclose = () => {
      console.log("🌐 [Global WS] disconnected");
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [user]);

  return (
    <ChatSocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </ChatSocketContext.Provider>
  );
};

export const useChatSocket = () => useContext(ChatSocketContext);
