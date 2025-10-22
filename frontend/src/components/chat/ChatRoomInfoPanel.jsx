import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaUserPlus, FaPen } from "react-icons/fa";
import {
  getChatParticipants,
  renameChatRoom,
  leaveChatRoom,
} from "../../api/chatApi";
import NewChatModal from "./NewChatModal";

const ChatRoomInfoPanel = ({ room, onBack, refreshRoom, onLeaveRoom }) => {
  const [participants, setParticipants] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState(room?.name || "");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await getChatParticipants(room.id);
        setParticipants(res);
      } catch (err) {
        console.error("❌ 채팅방 참여자 불러오기 실패:", err);
      }
    };

    if (room?.id) fetchParticipants();
  }, [room?.id]);

  const handleRename = async () => {
    try {
      await renameChatRoom(room.id, newName);
      setShowModal(false);
      if (refreshRoom) refreshRoom();
    } catch (err) {
      console.error("채팅방 이름 변경 실패:", err);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-gray-100 shadow-lg rounded-xl border border-gray-200 z-50 flex flex-col overflow-hidden">
        {/* 상단바 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <button onClick={onBack} className="text-gray-600 hover:text-black">
            <FaArrowLeft />
          </button>

          <div className="flex flex-col items-center gap-2">
            <div className="grid grid-cols-2 gap-2">
              {participants.slice(0, 4).map((user) => (
                <div
                  key={user.user_id}
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm"
                >
                  {user.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt={user.nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#DBDBDB] flex items-center justify-center">
                      <img
                        src="/default-avatar.png"
                        alt="default"
                        className="w-5 h-5"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {room?.name && (
                <span className="text-sm font-semibold">{room.name}</span>
              )}
              <FaPen
                className="text-xs text-gray-500 cursor-pointer"
                onClick={() => {
                  setNewName(room.name || "");
                  setShowModal(true);
                }}
              />
            </div>
          </div>

          <div className="w-5" />
        </div>

        {/* 대화상대 목록 */}
        <div className="flex-1 px-4 py-3 overflow-y-auto">
          <div className="text-sm font-semibold mb-2">
            대화상대 {participants.length}
          </div>

          <div
            className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-100 px-2 rounded"
            onClick={() => setShowInviteModal(true)}
          >
            <FaUserPlus className="text-gray-500" />
            <span className="text-sm text-gray-700">초대하기</span>
          </div>

          {participants.map((user) => (
            <div
              key={user.user_id}
              className="flex items-center gap-2 py-2 px-2 rounded hover:bg-gray-100"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-sm">
                {user.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#DBDBDB] flex items-center justify-center">
                    <img
                      src="/default-avatar.png"
                      alt="default"
                      className="w-5 h-5"
                    />
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-800">
                {user.is_me ? (
                  <>
                    <span className="mr-1 text-xs bg-gray-300 text-black px-1 rounded">
                      나
                    </span>
                    {user.nickname}
                  </>
                ) : (
                  user.nickname
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 하단: 나가기 */}
        <div className="border-t bg-white p-3">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="text-sm text-red-500 w-full py-1.5 hover:bg-red-50 rounded-md transition"
          >
            채팅방 나가기
          </button>
        </div>
      </div>

      {/* 채팅방 이름 변경 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-md w-80">
            <h2 className="text-sm font-bold mb-2">채팅방 이름 변경</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border px-3 py-1.5 rounded-md mb-3 text-sm"
              placeholder="새 채팅방 이름"
            />
            <div className="flex justify-end gap-2 text-sm">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleRename}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅방 나가기 확인 모달 */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-md w-80">
            <h2 className="text-sm font-bold mb-3">정말 나가시겠어요?</h2>
            <p className="text-sm text-gray-600 mb-4">
              채팅방 목록으로 이동합니다.
            </p>
            <div className="flex justify-end gap-2 text-sm">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  try {
                    await leaveChatRoom(room.id);
                    if (onLeaveRoom) onLeaveRoom(); // navigate 대신 상위에서 제어
                  } catch (err) {
                    console.error("❌ 채팅방 나가기 실패:", err);
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 초대하기 모달: 이 위치가 맞습니다 */}
      {showInviteModal && (
        <NewChatModal
          onClose={() => setShowInviteModal(false)}
          onCreateRoom={(newRoom) => {
            setShowInviteModal(false);
            // 필요하면 여기에 새 채팅방 처리 추가
          }}
        />
      )}
    </>
  );
};

export default ChatRoomInfoPanel;
