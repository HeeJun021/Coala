import React, { useState, useEffect, useRef } from "react";
import {
  FaArrowLeft,
  FaSearch,
  FaBars,
  FaPlus,
  FaPaperPlane,
} from "react-icons/fa";
import ChatRoomInfoPanel from "./ChatRoomInfoPanel";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "../../api/chatApi";
import { useAuth } from "../../context/AuthContext";

const ChatRoomPanel = ({ room, onBack, refreshRoom, handleLeaveRoom }) => {
  const { user } = useAuth(); // 현재 로그인한 사용자 정보

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [showInfo, setShowInfo] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const messageEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await getMessages(room.id);
        const reversed = res.reverse(); // 최신이 아래쪽
        setMessages(reversed);

        // ✅ 마지막 메시지 기준으로 읽음 처리
        if (reversed.length > 0) {
          const lastMessageId = reversed[reversed.length - 1].message_id;
          await markMessagesAsRead(room.id, {
            last_read_message_id: lastMessageId,
          });

          // ✅ 읽음 처리 후 다시 불러오기 (read_count 업데이트 반영 목적)
          const updated = await getMessages(room.id);
          setMessages(updated.reverse());
        }
      } catch (err) {
        console.error("메시지 불러오기 실패:", err);
      }
    };
    fetchMessages();
  }, [room.id]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await getMessages(room.id);
        setMessages(res.reverse()); // 최신 메시지가 아래쪽
      } catch (err) {
        console.error("메시지 불러오기 실패:", err);
      }
    };
    fetchMessages();
  }, [room.id]);

  useEffect(() => {
    if (!isSearching && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, isSearching]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      const res = await sendMessage(room.id, {
        message: input,
        message_type: "text",
      });
      setMessages((prev) => [...prev, res]);
      setInput("");
    } catch (err) {
      console.error("메시지 전송 실패:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter(
        (msg) =>
          msg.message_type === "text" &&
          msg.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (showInfo) {
    return (
      <ChatRoomInfoPanel
        room={room}
        onBack={() => setShowInfo(false)}
        refreshRoom={refreshRoom}
        onLeaveRoom={() => {
          handleLeaveRoom(); // ✅ ChatListPanel로 이동
          setShowInfo(false); // ✅ info 패널 닫기
        }}
      />
    );
  }

  return (
    <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-sky-100 shadow-lg rounded-xl border border-gray-200 z-50 flex flex-col overflow-hidden">
      {/* 상단바 */}
      <div className="px-4 py-2 border-b border-gray-300 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-gray-600 hover:text-black">
            <FaArrowLeft />
          </button>
          <span className="text-base font-semibold text-gray-800">
            {room?.room_name || "채팅방"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <FaSearch
            className="cursor-pointer hover:text-black"
            onClick={() => setIsSearching((prev) => !prev)}
          />

          <FaBars
            className="cursor-pointer hover:text-black"
            onClick={() => setShowInfo(true)}
          />
        </div>
      </div>
      {isSearching && (
        <div className="px-3 py-1 bg-white border-b border-gray-300">
          <input
            type="text"
            placeholder="메시지 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1 text-sm border rounded"
          />
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 flex flex-col">
        {filteredMessages.map((msg, index) => {
          const isMine = msg.sender_id === user?.user_id;
          const isSystem = msg.message_type === "system";
          const formattedTime = new Date(msg.sent_at).toLocaleTimeString(
            "ko-KR",
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }
          );

          const currentTimeKey = formattedTime;
          const prevMsg = messages[index + 1]; // ← index - 1 ❌

          const isLastOfBundle =
            !prevMsg ||
            prevMsg.sender_id !== msg.sender_id ||
            new Date(prevMsg.sent_at).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }) !== currentTimeKey;

          if (isSystem) {
            return (
              <div
                key={msg.message_id}
                className="text-center text-xs text-gray-500 my-2"
              >
                {msg.message}
              </div>
            );
          }

          return (
            <div
              key={msg.message_id}
              className={`flex w-full ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              {/* 왼쪽(상대방) 프로필 or 빈 공간 */}
              {!isMine && (
                <div className="flex flex-col items-center mr-2 min-w-[40px]">
                  {index === 0 ||
                  messages[index - 1]?.sender?.user_id !==
                    msg.sender.user_id ? (
                    <>
                      <div className="text-[10px] text-gray-600 mb-1">
                        {msg.sender.nickname}
                      </div>
                      {msg.sender.profile_image_url ? (
                        <img
                          src={msg.sender.profile_image_url}
                          alt="프로필"
                          onError={(e) => {
                            e.target.src = "/default-profile.png";
                          }}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#DBDBDB] flex items-center justify-center">
                          <img
                            src="/default-avatar.png"
                            alt="default"
                            className="w-5 h-5"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
              )}

              {/* 메시지 + 시간 */}
              {isMine ? (
                <div className="flex w-full justify-end items-end gap-1">
                  <div className="flex flex-col items-end text-[10px] text-gray-500 leading-tight mb-0.5">
                    {msg.read_count !== undefined &&
                      msg.read_count < room.participants.length && (
                        <span className="text-yellow-600 font-semibold">
                          {room.participants.length - msg.read_count}
                        </span>
                      )}
                    {isLastOfBundle && <span>{formattedTime}</span>}
                  </div>
                  <div className="px-3 py-2 rounded-xl text-sm whitespace-pre-line shadow leading-snug bg-yellow-200 text-right max-w-[70%]">
                    {msg.message}
                  </div>
                </div>
              ) : (
                <div className="flex items-end max-w-[80%] gap-1">
                  <div className="px-3 py-2 rounded-xl text-sm whitespace-pre-line shadow leading-snug bg-white text-left">
                    {msg.message}
                  </div>
                  <div className="flex flex-col items-end justify-end text-[10px] leading-tight h-full mb-0.5">
                    {msg.read_count !== undefined &&
                      msg.read_count < room.participants.length && (
                        <span className="text-yellow-600 font-semibold">
                          {room.participants.length - msg.read_count}
                        </span>
                      )}
                    {isLastOfBundle && (
                      <span className="text-gray-500">{formattedTime}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div ref={messageEndRef}></div>
      </div>

      {/* 입력창 */}
      <div className="px-3 py-2 border-t border-gray-300 bg-white flex items-center gap-2">
        <FaPlus className="text-gray-400" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-1.5 rounded-full bg-gray-100 text-sm focus:outline-none"
          placeholder="메시지 입력"
        />
        <button onClick={handleSend} className="text-gray-500 hover:text-black">
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatRoomPanel;
