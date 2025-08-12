import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const ChatUIContext = createContext(null);

export function ChatUIProvider({ children }) {
  // 채팅 패널 열림 여부 + 활성화된 방 ID
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);

  const openChat = useCallback((roomId = null) => {
    setIsOpen(true);
    setActiveRoomId(roomId);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setActiveRoomId(null);
  }, []);

  const value = useMemo(
    () => ({ isOpen, activeRoomId, openChat, closeChat, setActiveRoomId }),
    [isOpen, activeRoomId, openChat, closeChat]
  );

  return (
    <ChatUIContext.Provider value={value}>{children}</ChatUIContext.Provider>
  );
}

export function useChatUI() {
  const ctx = useContext(ChatUIContext);
  if (!ctx) {
    throw new Error("useChatUI must be used within ChatUIProvider");
  }
  return ctx;
}
