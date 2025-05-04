import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const NewChatModal = ({ onClose }) => {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    // ✅ 더미 팔로잉 목록 사용
    const dummyFriends = [
      {
        id: 1,
        nickname: "엄준식",
        profileImageUrl: "https://via.placeholder.com/32",
      },
      {
        id: 2,
        nickname: "김상현",
        profileImageUrl: "https://via.placeholder.com/32",
      },
      {
        id: 3,
        nickname: "이현성",
        profileImageUrl: "https://via.placeholder.com/32",
      },
      {
        id: 4,
        nickname: "차우성",
        profileImageUrl: null,
      },
      {
        id: 5,
        nickname: "방호현",
        profileImageUrl: null,
      },
      {
        id: 6,
        nickname: "최찬율",
        profileImageUrl: null,
      },
    ];
    setFriends(dummyFriends);
  }, []);
  

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white w-[400px] max-h-[520px] rounded-lg shadow-lg p-5 relative">
        {/* 헤더 */}
        <div className="text-center font-semibold text-lg mb-4">새로운 메시지</div>
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        {/* 검색 입력 */}
        <input
          type="text"
          placeholder="받는 사람..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border px-3 py-2 rounded text-sm mb-3"
        />

        {/* 추천 사용자 목록 */}
        <div className="text-sm text-gray-600 mb-1">추천</div>
        <div className="overflow-y-auto max-h-[280px] space-y-2 pr-1">
          {friends
            .filter((user) =>
              user.nickname.toLowerCase().includes(search.toLowerCase())
            )
            .map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedUserId(user.id)}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={user.profileImageUrl || "/default-profile.png"}
                    alt="profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-800">{user.nickname}</span>
                </div>
                <input
                  type="radio"
                  name="selectedUser"
                  checked={selectedUserId === user.id}
                  readOnly
                />
              </div>
            ))}
        </div>

        {/* 채팅 버튼 */}
        <button
          disabled={!selectedUserId}
          className={`w-full mt-4 py-2 rounded text-white text-sm font-medium ${
            selectedUserId ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-100 text-gray-400 cursor-default"
          }`}
        >
          채팅
        </button>
      </div>
    </div>
  );
};

export default NewChatModal;
