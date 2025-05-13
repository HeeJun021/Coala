import React, { useState } from "react";
import ChatListPanel from "./ChatListPanel";
import ChatRoomPanel from "./ChatRoomPanel";

const ChatPanelWrapper = ({ onClose }) => {
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
  };

  const handleBack = () => {
    setSelectedRoom(null);
  };

  return selectedRoom ? (
    <ChatRoomPanel
      room={selectedRoom}
      onBack={handleBack}
      handleLeaveRoom={() => setSelectedRoom(null)}
    />
  ) : (
    <ChatListPanel onSelectRoom={handleSelectRoom} onClose={onClose} />
  );
};

export default ChatPanelWrapper;
