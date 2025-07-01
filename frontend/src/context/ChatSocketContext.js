import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
  } from "react";
  import { useAuth } from "./AuthContext";
  
  const ChatSocketContext = createContext();
  
  export const ChatSocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
  
    // 읽음 콜백 리스트 ref
    const readCallbacksRef = useRef([]);
  
    // 콜백 등록
    const registerReadCallback = (cb) => {
      if (typeof cb === "function") {
        readCallbacksRef.current.push(cb);
      }
    };
  
    // 콜백 제거
    const clearReadCallbacks = () => {
      readCallbacksRef.current = [];
    };
  
    useEffect(() => {
      if (!user) {
        console.log("⛔ user 없음 → WebSocket 연결 안 함");
        return;
      }
  
      const socket = new WebSocket("ws://localhost:8000/ws/chat");
      socketRef.current = socket;
  
      console.log("🌐 [WS INIT] WebSocket 생성됨");
  
      socket.onopen = () => {
        console.log("[WS 연결 성공]");
        setConnected(true);
      };
  
      socket.onclose = () => {
        console.log("[WS 연결 종료]");
        setConnected(false);
      };
  
      socket.onerror = (e) => {
        console.error("[WS 오류 발생]:", e);
      };
  
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WS 수신]:", data);
  
          if (data.type === "read") {
            readCallbacksRef.current.forEach((cb) => cb(data));
          }
  
          if (data.type === "message") {
            // 다른 타입 처리 가능
          }
        } catch (err) {
          console.error("[WS 메시지 파싱 실패]:", err);
        }
      };
  
      return () => {
        console.log("[WS 정리] 소켓 닫힘");
        socket.close();
      };
    }, [user]); // user가 바뀔 때마다 새 WebSocket 연결
  
    return (
      <ChatSocketContext.Provider
        value={{
          socket: socketRef.current,
          connected,
          registerReadCallback,
          clearReadCallbacks,
        }}
      >
        {children}
      </ChatSocketContext.Provider>
    );
  };
  
  export const useChatSocket = () => useContext(ChatSocketContext);
  