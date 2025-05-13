import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  uploadFiles,
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
  const [isFetching, setIsFetching] = useState(false);

  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [hoveredImageId, setHoveredImageId] = useState(null);

  const [socketReady, setSocketReady] = useState(false); // ✅ 상태 추가

  const containerRef = useRef(null);
  const topRef = useRef(null);

  const LIMIT = 20;

  const fetchMessages = useCallback(
    async (beforeMessageId = null, append = false) => {
      try {
        const res = await getMessages(room.id, LIMIT, beforeMessageId);
        const hasMoreData = res.length === LIMIT;
        const reversed = res.reverse();

        setMessages((prev) => {
          const combined = append ? [...reversed, ...prev] : reversed;

          // ✅ 중복 message_id 제거
          const uniqueMap = new Map();
          combined.forEach((msg) => {
            uniqueMap.set(msg.message_id, msg);
          });

          return Array.from(uniqueMap.values()).sort(
            (a, b) => a.message_id - b.message_id
          );
        });

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
    if (!container || isSearching || isFetching) return;

    const handleScroll = () => {
      if (
        container.scrollTop <= 20 &&
        hasMore &&
        messages.length > 0 &&
        !isFetching
      ) {
        const oldestMessageId = messages[0]?.message_id;
        const prevTopMsg = container.querySelector(
          `[data-id='${oldestMessageId}']`
        );
        const prevOffset = prevTopMsg?.getBoundingClientRect().top ?? 0;

        setIsFetching(true);

        fetchMessages(oldestMessageId, true).then(() => {
          requestAnimationFrame(() => {
            const newTopMsg = container.querySelector(
              `[data-id='${oldestMessageId}']`
            );
            const newOffset = newTopMsg?.getBoundingClientRect().top ?? 0;
            const delta = newOffset - prevOffset;

            // 🔒 깜빡임 방지: scrollBehavior 임시 비활성화
            container.style.scrollBehavior = "auto";
            container.scrollTop += delta;

            // 🔓 다시 부드럽게 설정
            setTimeout(() => {
              container.style.scrollBehavior = "smooth";
            }, 0);

            setIsFetching(false);
          });
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages, hasMore, isSearching, fetchMessages, isFetching]);

  useEffect(() => {
    if (!isSearching && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isSearching]);

  useEffect(() => {
    if (!socketReady || !messages.length) return;

    const socket = socketRef.current;
    const lastMessage = messages[messages.length - 1];

    const isFromOtherUser =
      lastMessage && lastMessage.sender_id !== user.user_id;

    // ✅ 메시지 도착 후 DOM 그려지고 나서 읽음 전송
    const timeout = setTimeout(() => {
      if (socket && socket.readyState === WebSocket.OPEN && isFromOtherUser) {
        console.log(
          "📤 [읽음 전송] ChatRoomPanel → message_id:",
          lastMessage.message_id
        );
        socket.send(
          JSON.stringify({
            type: "read",
            message_id: lastMessage.message_id,
          })
        );
      }
    }, 100); // 약간의 지연

    return () => clearTimeout(timeout);
  }, [socketReady, messages, user.user_id]);

  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket(
      `ws://localhost:8000/ws/chat?room_id=${room.id}`
    );

    socketRef.current.onopen = () => {
      console.log("✅ [ChatRoom WS 연결됨] room_id:", room.id);

      setSocketReady(true); // ✅ 연결 완료 표시
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 [WS 수신] ChatRoomPanel →", data);

      if (data.type === "message" && data.room_id === room.id) {
        console.log(
          "💬 [메시지 수신] room_id:",
          data.room_id,
          "message_id:",
          data.message_id
        );

        setMessages((prev) => [
          ...prev,
          {
            ...data,
            read_count: room.participants.length - data.unread_count,
          },
        ]);

        if (data.sender_id !== user.user_id) {
          console.log(
            "📤 [즉시 읽음 전송] 상대 메시지 감지됨 → message_id:",
            data.message_id
          );
          socketRef.current.send(
            JSON.stringify({
              type: "read",
              message_id: data.message_id,
            })
          );
        }
        return;
      }

      if (data.type === "read") {
        const { message_id, unread_count } = data;
        console.log(
          "✅ [읽음 수신] ChatRoomPanel → message_id:",
          message_id,
          "unread_count:",
          unread_count
        );

        setMessages((prev) =>
          prev.map((msg) =>
            parseInt(msg.message_id) === parseInt(message_id)
              ? {
                  ...msg,
                  read_count: room.participants.length - unread_count,
                }
              : msg
          )
        );
      }
    };

    return () => {
      socketRef.current?.close();
    };
  }, [room.id, room.participants.length, user.user_id]); // ✅ 여기 추가됨

  const handleSend = () => {
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        message: input,
        message_type: "text",
      })
    );
    setInput("");
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
          const isMine =
            msg.sender?.user_id === user?.user_id ||
            msg.sender_id === user?.user_id;

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

          const isExpired = (uploadedAt) => {
            const uploadedDate = new Date(uploadedAt);
            const now = new Date();
            const diffDays = (now - uploadedDate) / (1000 * 60 * 60 * 24);
            return diffDays > 7;
          };

          if (isSystem) {
            return (
              <div
                key={msg.message_id}
                data-id={msg.message_id} // ✅ 이 줄만 추가!
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
              data-id={msg.message_id} // ✅ 이 줄만 추가!
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

                  {msg.message_type === "image" ? (
                    <div
                      className="relative group"
                      onMouseEnter={() => setHoveredImageId(msg.message_id)}
                      onMouseLeave={() => setHoveredImageId(null)}
                    >
                      {/* 이미지 */}
                      <img
                        src={`${process.env.REACT_APP_BACKEND_URL}${msg.file_url}`}
                        alt={msg.file_name}
                        className="max-w-[200px] max-h-[200px] rounded-md object-cover cursor-pointer"
                        onClick={() =>
                          setPreviewImage(
                            `${process.env.REACT_APP_BACKEND_URL}${msg.file_url}`
                          )
                        }
                      />

                      {/* 애니메이션: 그라데이션 */}
                      <AnimatePresence>
                        {hoveredImageId === msg.message_id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-black/40 to-transparent rounded-md z-10"
                          />
                        )}
                      </AnimatePresence>

                      {/* 애니메이션: 다운로드 버튼 */}
                      <AnimatePresence>
                        {hoveredImageId === msg.message_id && (
                          <motion.a
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            href={`${
                              process.env.REACT_APP_BACKEND_URL
                            }/download/${msg.file_url
                              .split("/")
                              .pop()}?original_name=${encodeURIComponent(
                              msg.file_name
                            )}`}
                            className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md z-20 hover:bg-gray-200 transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src="/download-icon.png"
                              alt="다운로드"
                              className="w-4 h-4"
                            />
                          </motion.a>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : msg.message_type === "file" ? (
                    <div className="bg-white p-2 rounded-md text-sm max-w-[200px] flex flex-col">
                      <span className="font-medium text-blue-600 truncate">
                        {msg.file_name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {(msg.file_size / 1024).toFixed(1)} KB
                      </span>
                      {msg.uploaded_at && (
                        <span className="text-[10px] text-gray-400 mt-1">
                          유효기간: ~
                          {new Date(
                            new Date(msg.uploaded_at).getTime() +
                              7 * 24 * 60 * 60 * 1000
                          )
                            .toLocaleDateString("ko-KR")
                            .replace(/\. /g, ".")
                            .replace(/\.$/, ".")}
                        </span>
                      )}

                      {!isExpired(msg.uploaded_at) ? (
                        <a
                          href={`${
                            process.env.REACT_APP_BACKEND_URL
                          }/download/${msg.file_url
                            .split("/")
                            .pop()}?original_name=${encodeURIComponent(
                            msg.file_name
                          )}`}
                          className="text-xs text-blue-500 underline mt-1 text-left"
                        >
                          다운로드
                        </a>
                      ) : (
                        <span className="text-xs text-red-500 mt-1">
                          ⛔ 유효기간 만료
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="px-3 py-2 rounded-xl text-sm whitespace-pre-line shadow leading-snug bg-[#FFF36C] text-black max-w-[70%]">
                      {msg.message}
                    </div>
                  )}
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
                    {msg.message_type === "image" ? (
                      <div
                        className="relative group"
                        onMouseEnter={() => setHoveredImageId(msg.message_id)}
                        onMouseLeave={() => setHoveredImageId(null)}
                      >
                        {/* 이미지 */}
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}${msg.file_url}`}
                          alt={msg.file_name}
                          className="max-w-[200px] max-h-[200px] rounded-md object-cover cursor-pointer"
                          onClick={() =>
                            setPreviewImage(
                              `${process.env.REACT_APP_BACKEND_URL}${msg.file_url}`
                            )
                          }
                        />

                        {/* 애니메이션: 그라데이션 */}
                        <AnimatePresence>
                          {hoveredImageId === msg.message_id && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-black/40 to-transparent rounded-md z-10"
                            />
                          )}
                        </AnimatePresence>

                        {/* 애니메이션: 다운로드 버튼 */}
                        <AnimatePresence>
                          {hoveredImageId === msg.message_id && (
                            <motion.a
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.2 }}
                              href={`${
                                process.env.REACT_APP_BACKEND_URL
                              }/download/${msg.file_url
                                .split("/")
                                .pop()}?original_name=${encodeURIComponent(
                                msg.file_name
                              )}`}
                              className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md z-20 hover:bg-gray-200 transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img
                                src="/download-icon.png"
                                alt="다운로드"
                                className="w-4 h-4"
                              />
                            </motion.a>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : msg.message_type === "file" ? (
                      <div className="bg-gray-100 p-2 rounded-md text-sm max-w-[200px] flex flex-col">
                        <span className="font-medium text-blue-600 truncate">
                          {msg.file_name}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {(msg.file_size / 1024).toFixed(1)} KB
                        </span>
                        {msg.uploaded_at && (
                          <span className="text-[10px] text-gray-400 mt-1">
                            유효기간: ~
                            {new Date(
                              new Date(msg.uploaded_at).getTime() +
                                7 * 24 * 60 * 60 * 1000
                            )
                              .toLocaleDateString("ko-KR")
                              .replace(/\. /g, ".")
                              .replace(/\.$/, ".")}
                          </span>
                        )}

                        {!isExpired(msg.uploaded_at) ? (
                          <a
                            href={`${
                              process.env.REACT_APP_BACKEND_URL
                            }/download/${msg.file_url
                              .split("/")
                              .pop()}?original_name=${encodeURIComponent(
                              msg.file_name
                            )}`}
                            className="text-xs text-blue-500 underline mt-1 text-left"
                          >
                            다운로드
                          </a>
                        ) : (
                          <span className="text-xs text-red-500 mt-1">
                            ⛔ 유효기간 만료
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-xl text-sm whitespace-pre-line shadow leading-snug bg-white text-left">
                        {msg.message}
                      </div>
                    )}

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
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="미리보기"
            className="max-w-full max-h-full rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* 입력창 */}
      <div className="px-3 py-2 border-t border-gray-300 bg-white flex items-center gap-2">
        {/* + 버튼 */}
        <FaPlus
          className="text-gray-400 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        />

        {/* 숨겨진 파일 input */}
        <input
          type="file"
          multiple
          hidden
          ref={fileInputRef}
          onChange={async (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;

            try {
              const uploaded = await uploadFiles(files); // API 호출
              for (const file of uploaded) {
                await sendMessage(room.id, {
                  message_type: file.message_type,
                  message: "파일을 보냈습니다.",
                  file_url: file.file_url,
                  file_name: file.file_name, // ✅ 추가
                  file_size: file.file_size, // ✅ 추가
                  uploaded_at: file.uploaded_at, // ✅ 추가 (유효기간 쓸 때 필요)
                });
              }
              await fetchMessages(0, false); // 메시지 새로고침
            } catch (err) {
              console.error("파일 업로드 실패:", err);
            } finally {
              e.target.value = null; // 같은 파일 다시 선택 가능
            }
          }}
        />

        {/* 텍스트 입력창 */}
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
