import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef(null);
  const topRef = useRef(null);
  const LIMIT = 20;

  const fetchMessages = useCallback(
    async (beforeMessageId = null, append = false) => {
      try {
        const res = await getMessages(room.id, LIMIT, beforeMessageId);
        const hasMoreData = res.length === LIMIT;
        const reversed = res.reverse();

        setMessages((prev) => (append ? [...reversed, ...prev] : reversed));
        setHasMore(hasMoreData);

        if (res.length > 0) {
          const lastMessageId = res[res.length - 1].message_id;
          await markMessagesAsRead(room.id, {
            last_read_message_id: lastMessageId,
          });
        }
      } catch (err) {
        console.error("메시지 불러오기 실패:", err);
      }
    },
    [room.id]
  );

  useEffect(() => {
    fetchMessages(null, false);
  }, [fetchMessages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isSearching) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && messages.length > 0) {
        const oldestMessageId = messages[0]?.message_id;
        const currentHeight = container.scrollHeight;

        fetchMessages(oldestMessageId, true).then(() => {
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - currentHeight;
          });
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages, hasMore, isSearching, fetchMessages]);

  useEffect(() => {
    if (!isSearching && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isSearching]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await sendMessage(room.id, {
        message: input,
        message_type: "text",
      });
      setInput("");
      await fetchMessages(0, false);
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

  const getFormattedTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const findPrevTextMessage = (i, conditionFn = () => true) => {
    for (let j = i - 1; j >= 0; j--) {
      const m = filteredMessages[j];
      if (m.message_type === "text" && conditionFn(m)) return m;
    }
    return null;
  };

  if (showInfo) {
    return (
      <ChatRoomInfoPanel
        room={room}
        onBack={() => setShowInfo(false)}
        refreshRoom={refreshRoom}
        onLeaveRoom={() => {
          handleLeaveRoom();
          setShowInfo(false);
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
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2 flex flex-col"
      >
        {[...filteredMessages].map((msg, index) => {
          const isFirstMessage = index === 0;
          const isMine = msg.sender?.user_id === user?.user_id;
          const isSystem = msg.message_type === "system";

          const findNextTextMessage = (startIndex, condition = () => true) => {
            for (let i = startIndex + 1; i < filteredMessages.length; i++) {
              const m = filteredMessages[i];
              if (m.message_type !== "system" && condition(m)) {
                return m;
              }
            }
            return null;
          };

          const prevOtherMsg = findPrevTextMessage(
            index,
            (m) => m.sender?.user_id !== user?.user_id
          );

          const currentTime = getFormattedTime(msg.sent_at);
          const prevOtherTime = prevOtherMsg
            ? getFormattedTime(prevOtherMsg.sent_at)
            : null;

          const nextMsg = findNextTextMessage(index);

          const isLastOfBundle =
            !nextMsg || // 다음 메시지가 없거나
            nextMsg.sender?.user_id !== msg.sender?.user_id || // 다음 메시지의 보낸 사람 다르거나
            getFormattedTime(nextMsg.sent_at) !== currentTime; // 다음 메시지 시간 다르면

          const showProfile = isSearching
            ? true
            : !prevOtherMsg ||
              prevOtherMsg.sender_id !== msg.sender_id ||
              prevOtherTime !== currentTime;

          const isLastMessage = index === filteredMessages.length - 1;
          const isLastOfBundleOrLastMessage = isLastOfBundle || isLastMessage;

          if (isSystem) {
            return (
              <div
                key={msg.message_id}
                ref={isFirstMessage ? topRef : null}
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
              {isMine ? (
                <div className="w-full flex justify-end items-end gap-1">
                  <div className="flex flex-col items-end text-[10px] text-gray-500 min-w-[40px]">
                    {msg.read_count < room.participants.length && (
                      <span>{room.participants.length - msg.read_count}</span>
                    )}
                    {isLastOfBundleOrLastMessage && <span>{currentTime}</span>}
                  </div>
                  <div className="px-3 py-2 rounded-xl text-sm whitespace-pre-line shadow leading-snug bg-[#FFF36C] text-black max-w-[70%]">
                    {msg.message}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center mr-2 min-w-[40px]">
                    {showProfile ? (
                      <>
                        <div className="text-[10px] text-gray-600 mb-1">
                          {msg.sender?.nickname || "알 수 없음"}
                        </div>
                        {msg.sender?.profile_image_url ? (
                          <img
                            src={msg.sender.profile_image_url}
                            alt="프로필"
                            onError={(e) =>
                              (e.target.src = "/default-profile.png")
                            }
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

                  <div className="flex items-end max-w-[80%] gap-1">
                    <div className="px-3 py-2 rounded-xl text-sm whitespace-pre-line shadow leading-snug bg-white text-left">
                      {msg.message}
                    </div>
                    <div className="flex flex-col items-end justify-end text-[10px] leading-tight h-full mb-0.5">
                      {msg.read_count < room.participants.length && (
                        <span className="text-yellow-600 font-semibold">
                          {room.participants.length - msg.read_count}
                        </span>
                      )}
                      {isLastOfBundle && (
                        <span className="text-gray-500">{currentTime}</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
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
