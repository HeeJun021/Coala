import React, { useEffect, useState } from "react";
import {
  getArchivedChatRooms,
  acceptChatRequest,
  rejectChatRequest,
} from "../../api/chatApi";
import { ChevronLeft } from "lucide-react";

const ArchivedChatPanel = ({ onBack, onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchArchived = async () => {
      try {
        const res = await getArchivedChatRooms();
        setRooms(res);
      } catch (err) {
        console.error("요청함 불러오기 실패:", err);
      }
    };
    fetchArchived();
  }, []);

  const handleAccept = async (roomId) => {
    await acceptChatRequest(roomId);
    setRooms((prev) => prev.filter((r) => r.room_id !== roomId));
  };

  const handleReject = async (roomId) => {
    await rejectChatRequest(roomId);
    setRooms((prev) => prev.filter((r) => r.room_id !== roomId));
  };

  return (
    <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-white shadow-lg rounded-xl border border-gray-200 z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-gray-100">
        <button
          onClick={onBack}
          className="flex items-center text-sm text-blue-500 hover:underline"
        >
          <ChevronLeft size={20} className="mr-1" />
        </button>

        <span className="font-bold text-gray-700">요청 메시지</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="text-sm text-center text-gray-500 p-6">
            요청 메시지가 없습니다.
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.room_id}
              onClick={() =>
                onSelectRoom &&
                onSelectRoom({
                  id: room.room_id,
                  name: room.room_name,
                  preview: room.last_message,
                  time: room.last_message_time,
                  unread: room.unread_count,
                  group: room.is_group,
                  participants: room.participants || [],
                  is_pinned: false,
                })
              }
              className="p-3 border-b hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{room.room_name}</div>
                  <div className="text-xs text-gray-500">
                    {room.last_message || "(메시지 없음)"}
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(room.room_id);
                    }}
                    className="px-3 py-1 text-sm rounded border border-green-500 text-green-600 hover:bg-green-50 transition"
                  >
                    수락
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(room.room_id);
                    }}
                    className="px-3 py-1 text-sm rounded border border-red-500 text-red-500 hover:bg-red-50 transition"
                  >
                    거절
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ArchivedChatPanel;
