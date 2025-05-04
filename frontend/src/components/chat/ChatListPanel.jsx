import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaCog, FaPen } from "react-icons/fa";
import ReactDOM from "react-dom";
import ChatListSettingsPanel from "./ChatListSettingsPanel";
import NewChatModal from "./NewChatModal";

const ChatListPanel = ({ onClose, onSelectRoom }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chatRooms, setChatRooms] = useState([
    {
      id: 1,
      name: "사용자 1",
      preview: "코딩이 어려워?(미리보기 메시지)",
      time: "12:03",
      unread: 1,
      group: false,
    },
    {
      id: 2,
      name: "팀 프로젝트 톡방",
      preview: "사진을 보냈습니다.",
      time: "11:52",
      unread: 3,
      group: true,
    },
  ]);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameInput, setRenameInput] = useState("");

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveTargetId, setLeaveTargetId] = useState(null);

  const [showSearch, setShowSearch] = useState(false); // 🔍 검색창 표시 여부
  const [searchQuery, setSearchQuery] = useState(""); // 검색어

  const [showNewChat, setShowNewChat] = useState(false);

  const menuRef = useRef();

  const handleContextMenu = (e, roomId) => {
    e.preventDefault();
    setContextMenu({ roomId, x: e.clientX, y: e.clientY });
  };

  const handleContextMenuClick = (action) => {
    if (!contextMenu) return;
    const { roomId } = contextMenu;
    const room = chatRooms.find((r) => r.id === roomId);

    if (action === "rename") {
      setRenameTarget(room);
      setRenameInput(room.name);
      setShowRenameModal(true);
    }

    if (action === "leave") {
      setLeaveTargetId(roomId);
      setShowLeaveModal(true);
    }

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

  const filteredRooms = chatRooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-white text-lg">
                {room.group ? "👥" : "👤"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {room.name}
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
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  채팅방 상단 고정
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
