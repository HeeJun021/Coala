import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaSearch, FaCog, FaPen } from "react-icons/fa";
import ReactDOM from "react-dom";
import ChatListSettingsPanel from "./ChatListSettingsPanel";
import NewChatModal from "./NewChatModal";
import { getChatRooms, togglePinChatRoom } from "../../api/chatApi";
import ChatRoomPanel from "./ChatRoomPanel";

const ChatListPanel = ({ onClose, onSelectRoom }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameInput, setRenameInput] = useState("");

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveTargetId, setLeaveTargetId] = useState(null);

  const [showSearch, setShowSearch] = useState(false); // 🔍 검색창 표시 여부
  const [searchQuery, setSearchQuery] = useState(""); // 검색어

  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null); // ✅ 현재 선택된 채팅방

  const { user } = useAuth();

  const menuRef = useRef();

  const handleContextMenu = (e, roomId) => {
    e.preventDefault();
    setContextMenu({ roomId, x: e.clientX, y: e.clientY });
  };

  const renderAvatars = (participants) => {
    if (!Array.isArray(participants)) return null;

    // 본인을 제외한 참가자만 필터링
    const others = participants.filter((p) => p.user_id !== user?.user_id);
    const displayUsers = others.slice(0, 4);

    const baseStyle =
      "absolute w-5 h-5 rounded-full border-2 border-white object-cover";
    const layoutStyles = [
      // 2명
      [
        "top-1/2 left-[40%] -translate-y-1/2 -translate-x-1/2",
        "top-1/2 left-[60%] -translate-y-1/2 -translate-x-1/2",
      ],
      // 3명
      [
        "top-[10%] left-1/2 -translate-x-1/2",
        "bottom-[10%] left-[30%] -translate-x-1/2",
        "bottom-[10%] right-[30%] translate-x-1/2",
      ],
      // 4명
      ["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"],
    ];

    // ✅ 1명만 있을 경우: 프로필 이미지 전체에 표시
    if (displayUsers.length === 1) {
      const onlyUser = displayUsers[0];
      const hasImage = onlyUser.profile_url?.trim();
      return hasImage ? (
        <img
          src={onlyUser.profile_url}
          alt={onlyUser.nickname}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-[#DBDBDB] flex items-center justify-center">
          <img
            src="/default-avatar.png" // 흰색 사람 아이콘
            alt="default"
            className="w-5 h-5"
          />
        </div>
      );
    }

    // ✅ 2~4명: 각 위치에 표시
    const layout = layoutStyles[displayUsers.length - 2] || layoutStyles[2];

    return (
      <>
        {displayUsers.map((user, index) => {
          const hasImage = user.profile_url?.trim();
          const position = layout[index];

          return hasImage ? (
            <img
              key={user.user_id}
              src={user.profile_url}
              alt={user.nickname}
              className={`${baseStyle} ${position}`}
            />
          ) : (
            <div
              key={user.user_id}
              className={`${baseStyle} ${position} bg-[#DBDBDB] flex items-center justify-center`}
            >
              <img
                src="/default-avatar.png"
                alt="default"
                className="w-3 h-3"
              />
            </div>
          );
        })}
      </>
    );
  };

  const handleContextMenuClick = async (action) => {
    if (!contextMenu) return;
    const { roomId } = contextMenu;
    const room = chatRooms.find((r) => r.id === roomId);

    if (action === "rename") {
      setRenameTarget(room);
      setRenameInput(room.name);
      setShowRenameModal(true);
      setContextMenu(null);
      return;
    }

    if (action === "leave") {
      setLeaveTargetId(roomId);
      setShowLeaveModal(true);
      setContextMenu(null);
      return;
    }

    if (action === "pin") {
      try {
        await togglePinChatRoom(roomId);
        const updatedRooms = await getChatRooms();

        const transformed = updatedRooms.map((room) => ({
          id: room.room_id,
          name: room.room_name ?? "이름 없음",
          preview: room.last_message || "(아직 메시지가 없습니다)",
          time: room.last_message_time
            ? new Date(room.last_message_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          rawTime: room.last_message_time || null,
          unread: room.unread_count ?? 0,
          group: room.is_group ?? false,
          participants: room.participants ?? [],
          is_pinned: room.is_pinned ?? false,
        }));


        setChatRooms(transformed);
      } catch (error) {
        console.error("상단 고정 실패:", error);
      }

      setContextMenu(null);
      return;
    }

    // 기본적으로는 메뉴 닫기
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRooms = chatRooms.filter(
    (room) =>
      typeof room.name === "string" &&
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const data = await getChatRooms();
        console.log("✅ 서버 응답:", data);

        const transformed = data.map((room) => ({
          id: room.room_id,
          name: room.room_name ?? "이름 없음",
          preview: room.last_message || "(아직 메시지가 없습니다)",
          time: room.last_message_time
            ? new Date(room.last_message_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          rawTime: room.last_message_time || null,
          unread: room.unread_count ?? 0,
          group: room.is_group ?? false,
          participants: room.participants ?? [],
          is_pinned: room.is_pinned ?? false, // ✅ 반드시 추가
          pinned_at: room.pinned_at ?? null, // ✅ 추가
        }));



        setChatRooms(transformed);
      } catch (error) {
        console.error("🚨 채팅방 목록 불러오기 실패:", error);
      }
    };

    fetchChatRooms();
  }, []);

  if (selectedRoom) {
    return (
      <ChatRoomPanel
        room={selectedRoom}
        onBack={() => setSelectedRoom(null)}
        refreshRoom={() => {
          // 필요시 목록 새로고침
        }}
        handleLeaveRoom={() => {
          setSelectedRoom(null);
        }}
      />
    );
  }

  return (
    <>
      <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-white shadow-lg rounded-xl border border-gray-200 z-50 flex flex-col">
        <div className="px-4 py-2 border-b bg-gray-100 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-800">채팅</span>
          <div className="flex items-center gap-3 text-gray-600">
            {showSearch ? (
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    setShowSearch(false);
                  }
                }}
                placeholder="채팅방 이름 검색"
                className="text-sm px-2 py-1 rounded border border-gray-300 w-32 focus:outline-none"
              />
            ) : (
              <FaSearch
                className="cursor-pointer hover:text-black"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearch(true);
                }}
              />
            )}

            <FaPen
              className="cursor-pointer hover:text-black"
              onClick={() => setShowNewChat(true)} // 새로운 채팅창 오픈
            />
            <FaCog
              className="cursor-pointer hover:text-black"
              onClick={() => setShowSettings(true)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center px-4 pt-2 pb-1 text-sm font-semibold text-gray-500">
          <span>메시지</span>
          <button className="text-blue-500 hover:underline text-xs">
            요청
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(searchQuery ? filteredRooms : chatRooms).map((room) => (
            <div
              key={room.id}
              onContextMenu={(e) => handleContextMenu(e, room.id)}
              onClick={() => onSelectRoom && onSelectRoom(room)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
            >
              <div className="w-10 h-10 rounded-full bg-purple-200 relative">
                {renderAvatars(room.participants)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  <div className="flex items-center gap-1">
                    <span>{room.name}</span>
                    {room.is_pinned && (
                      <span className="text-yellow-500">📌</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {room.preview}
                </div>
              </div>
              <div className="text-right text-xs text-gray-500 flex flex-col items-end">
                <span>{room.time}</span>
                {room.unread > 0 && (
                  <span className="mt-1 w-5 h-5 text-[11px] rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                    {room.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {contextMenu &&
          ReactDOM.createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 9999,
              }}
              className="bg-white shadow-md border rounded-md text-sm text-gray-700"
            >
              <ul>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleContextMenuClick("rename")}
                >
                  채팅방 이름 설정
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleContextMenuClick("pin")}
                >
                  {(() => {
                    const room = chatRooms.find(
                      (r) => r.id === contextMenu?.roomId
                    );
                    return room?.is_pinned
                      ? "채팅방 상단 해제"
                      : "채팅방 상단 고정";
                  })()}
                </li>

                <hr />
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  알림 끄기
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500"
                  onClick={() => handleContextMenuClick("leave")}
                >
                  채팅방 나가기
                </li>
              </ul>
            </div>,
            document.body
          )}

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
        >
          ✕
        </button>
      </div>

      {/* 설정창 */}
      {showSettings && (
        <ChatListSettingsPanel
          user={{ name: "사용자 이름" }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}

      {/* 채팅방 이름 변경 모달 */}
      {showRenameModal && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-5 w-[300px]">
            <div className="text-base font-semibold mb-2">채팅방 이름</div>
            <input
              type="text"
              value={renameInput}
              maxLength={50}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full border-b border-gray-400 outline-none text-sm py-1"
            />
            <div className="text-xs text-right text-gray-500 mt-1">
              {renameInput.length}/50
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setShowRenameModal(false)}
                className="text-sm text-gray-600 hover:text-black"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setChatRooms((prev) =>
                    prev.map((room) =>
                      room.id === renameTarget.id
                        ? { ...room, name: renameInput }
                        : room
                    )
                  );
                  setShowRenameModal(false);
                }}
                className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅방 나가기 모달 */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-5 w-[300px]">
            <div className="text-base font-semibold mb-4">
              채팅방에서 나가시겠습니까?
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-sm text-gray-600 hover:text-black"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setChatRooms((prev) =>
                    prev.filter((room) => room.id !== leaveTargetId)
                  );
                  setShowLeaveModal(false);
                }}
                className="px-4 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatListPanel;
