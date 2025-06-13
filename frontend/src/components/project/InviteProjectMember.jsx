import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { searchUsers } from "../../api/followApi"; // 사용자 검색 API

const InviteProjectMember = ({
  selectedFriend,
  setSelectedFriend,
  onClose,
  onInvite,
}) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!search.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await searchUsers(search.trim());
        setResults(res); // [{ user_id, nickname, email, profile_image }]
      } catch (err) {
        console.error("❌ 유저 검색 실패:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleSelect = (user) => {
    if (selectedFriend?.id === user.user_id) {
      setSelectedFriend(null);
    } else {
      setSelectedFriend({ id: user.user_id, nickname: user.nickname });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-[400px] max-h-[500px] rounded-lg shadow-lg p-5 relative"
      >
        {/* 헤더 */}
        <div className="text-center font-semibold text-lg mb-4">멤버 초대</div>
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          <FaTimes />
        </button>

        {/* 검색 입력 */}
        <input
          type="text"
          placeholder="사용자 검색 (닉네임, 이메일)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border px-3 py-2 rounded text-sm mb-3"
        />

        {/* 검색 결과 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoading ? "loading" : `results-${search.trim()}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="h-[240px] overflow-y-auto space-y-2 pr-1"
          >
            {isLoading ? (
              <div className="text-center text-sm text-gray-500 mt-4">
                검색 중...
              </div>
            ) : results.length === 0 ? (
              <div className="text-center text-sm text-gray-500 mt-4">
                검색 결과가 없습니다.
              </div>
            ) : (
              results.map((user) => (
                <div
                  key={user.user_id}
                  className={`flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 cursor-pointer ${
                    selectedFriend?.id === user.user_id ? "bg-blue-100" : ""
                  }`}
                  onClick={() => handleSelect(user)}
                >
                  <div className="flex items-center gap-2">
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt="profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
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
                    readOnly
                    checked={selectedFriend?.id === user.user_id}
                  />
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {/* 프로젝트 초대 버튼 */}
        <button
          onClick={onInvite}
          disabled={!selectedFriend}
          className={`w-full mt-4 py-2 rounded text-sm font-medium ${
            selectedFriend
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-100 text-gray-500 cursor-not-allowed"
          }`}
        >
          프로젝트 초대
        </button>
      </motion.div>
    </div>
  );
};

export default InviteProjectMember;
