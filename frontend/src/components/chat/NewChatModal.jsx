import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import { motion, AnimatePresence } from "framer-motion";

const NewChatModal = ({ onClose, onCreateRoom }) => {
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await apiClient.get("/follow/recommended");
        setRecommendedUsers(res.data);
      } catch (err) {
        console.error("❌ 추천 유저 불러오기 실패:", err);
      }
    };
    fetchRecommended();
  }, []);

  useEffect(() => {
    const fetchSearch = async () => {
      if (!search.trim()) return;
      setIsLoading(true);
      try {
        const res = await apiClient.get(
          `/follow/search?keyword=${search.trim()}`
        );
        setSearchResults(res.data);
      } catch (err) {
        console.error("❌ 유저 검색 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSearch();
  }, [search]);

  const displayUsers = search.trim() ? searchResults : recommendedUsers;

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateChat = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      const res = await apiClient.post("/api/chat/create", {
        room_type: "general",
        is_group: selectedUserIds.length > 1,
        participant_ids: selectedUserIds,
      });
      if (onCreateRoom) onCreateRoom(res.data);
      onClose();
    } catch (err) {
      console.error("❌ 채팅방 생성 실패:", err);
    }
  };

  const renderSkeletonList = () => {
    return Array.from({ length: 7 }).map((_, idx) => (
      <div
        key={idx}
        className="flex items-center gap-2 px-2 py-2 animate-pulse"
      >
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-[400px] max-h-[520px] rounded-lg shadow-lg p-5 relative"
      >
        {/* 헤더 */}
        <div className="text-center font-semibold text-lg mb-4">
          새로운 메시지
        </div>
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

        {/* 추천 or 검색 결과 */}
        <div className="text-sm text-gray-600 mb-1">
          {search.trim() ? "검색 결과" : "추천"}
        </div>

        {/* 유저 리스트 with 애니메이션 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={
              isLoading
                ? "loading"
                : `results-${search.trim() || "recommended"}`
            }
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-[250px] overflow-y-auto space-y-2 pr-1"
          >
            {isLoading
              ? renderSkeletonList()
              : displayUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                    onClick={() => toggleUserSelection(user.user_id)}
                  >
                    <div className="flex items-center gap-2">
                      {user.profile_image ? (
                        <img
                          src={user.profile_image}
                          alt="profile"
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
                      <span className="text-sm text-gray-800">
                        {user.nickname}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.user_id)}
                      readOnly
                    />
                  </div>
                ))}
          </motion.div>
        </AnimatePresence>

        {/* 채팅 버튼 */}
        <button
          onClick={handleCreateChat}
          disabled={selectedUserIds.length === 0}
          className={`w-full mt-4 py-2 rounded text-white text-sm font-medium ${
            selectedUserIds.length > 0
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-blue-100 text-gray-400 cursor-default"
          }`}
        >
          채팅 시작
        </button>
      </motion.div>
    </div>
  );
};

export default NewChatModal;
